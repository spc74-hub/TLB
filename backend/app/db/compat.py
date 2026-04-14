"""
Supabase-compatible query builder for direct PostgreSQL using asyncpg.

Replaces supabase-py's fluent API:
  supabase.table("servicios").select("*").eq("activo", True).execute()

With the same API but backed by raw SQL queries via asyncpg.
No SQLAlchemy models needed — works directly with table names.
"""
from __future__ import annotations
import os
import asyncpg
from typing import Any, Optional
from datetime import datetime, date

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        db_url = os.environ.get("DATABASE_URL", "")
        _pool = await asyncpg.create_pool(db_url, min_size=2, max_size=10)
    return _pool


class QueryResult:
    def __init__(self, data=None, count=None):
        self.data = data or []
        self.count = count


class QueryBuilder:
    def __init__(self, table: str):
        self._table = table
        self._op = "select"
        self._select_cols = "*"
        self._filters: list = []
        self._or_filters: list = []
        self._orders: list = []
        self._limit_val: Optional[int] = None
        self._offset_val: Optional[int] = None
        self._single = False
        self._count_mode: Optional[str] = None
        self._insert_data = None
        self._update_data = None

    def select(self, columns="*", count=None):
        self._op = "select"; self._select_cols = columns; self._count_mode = count; return self

    def insert(self, data):
        self._op = "insert"; self._insert_data = data; return self

    def update(self, data):
        self._op = "update"; self._update_data = data; return self

    def delete(self):
        self._op = "delete"; return self

    def eq(self, col, val): self._filters.append(("eq", col, val)); return self
    def neq(self, col, val): self._filters.append(("neq", col, val)); return self
    def gt(self, col, val): self._filters.append(("gt", col, val)); return self
    def gte(self, col, val): self._filters.append(("gte", col, val)); return self
    def lt(self, col, val): self._filters.append(("lt", col, val)); return self
    def lte(self, col, val): self._filters.append(("lte", col, val)); return self
    def in_(self, col, vals): self._filters.append(("in_", col, vals)); return self
    def is_(self, col, val): self._filters.append(("is_", col, val)); return self
    def ilike(self, col, val): self._filters.append(("ilike", col, val)); return self
    def contains(self, col, val): self._filters.append(("contains", col, val)); return self

    def or_(self, expr):
        self._or_filters.append(expr); return self

    def order(self, col, desc=False):
        self._orders.append((col, desc)); return self

    def limit(self, n):
        self._limit_val = n; return self

    def range(self, start, end):
        self._offset_val = start; self._limit_val = end - start + 1; return self

    def single(self):
        self._single = True; self._limit_val = 1; return self

    def maybe_single(self):
        self._single = True; self._limit_val = 1; return self

    async def execute(self) -> QueryResult:
        pool = await get_pool()
        async with pool.acquire() as conn:
            if self._op == "select": return await self._exec_select(conn)
            elif self._op == "insert": return await self._exec_insert(conn)
            elif self._op == "update": return await self._exec_update(conn)
            elif self._op == "delete": return await self._exec_delete(conn)
        return QueryResult()

    def _build_where(self, params: list) -> str:
        conditions = []
        for op, col, val in self._filters:
            if op == "eq":
                params.append(val); conditions.append(f'"{col}" = ${len(params)}')
            elif op == "neq":
                params.append(val); conditions.append(f'"{col}" != ${len(params)}')
            elif op == "gt":
                params.append(val); conditions.append(f'"{col}" > ${len(params)}')
            elif op == "gte":
                params.append(val); conditions.append(f'"{col}" >= ${len(params)}')
            elif op == "lt":
                params.append(val); conditions.append(f'"{col}" < ${len(params)}')
            elif op == "lte":
                params.append(val); conditions.append(f'"{col}" <= ${len(params)}')
            elif op == "in_":
                if val:
                    phs = []
                    for v in val:
                        params.append(v); phs.append(f"${len(params)}")
                    conditions.append(f'"{col}" IN ({", ".join(phs)})')
            elif op == "is_":
                if val is None: conditions.append(f'"{col}" IS NULL')
                elif val is True: conditions.append(f'"{col}" IS TRUE')
                elif val is False: conditions.append(f'"{col}" IS FALSE')
            elif op == "ilike":
                params.append(val); conditions.append(f'"{col}" ILIKE ${len(params)}')
            elif op == "contains":
                params.append(val); conditions.append(f'"{col}" @> ${len(params)}')

        for or_expr in self._or_filters:
            parts = or_expr.split(",")
            or_conds = []
            for part in parts:
                segs = part.strip().split(".", 2)
                if len(segs) >= 3:
                    c, o, v = segs[0], segs[1], segs[2]
                    params.append(v)
                    if o == "eq": or_conds.append(f'"{c}" = ${len(params)}')
                    elif o == "ilike": or_conds.append(f'"{c}" ILIKE ${len(params)}')
            if or_conds:
                conditions.append(f"({' OR '.join(or_conds)})")

        return f"WHERE {' AND '.join(conditions)}" if conditions else ""

    def _build_order(self) -> str:
        if not self._orders: return ""
        return "ORDER BY " + ", ".join(f'"{c}" {"DESC" if d else "ASC"}' for c, d in self._orders)

    def _build_limit(self) -> str:
        s = ""
        if self._limit_val is not None: s += f" LIMIT {self._limit_val}"
        if self._offset_val is not None: s += f" OFFSET {self._offset_val}"
        return s

    @staticmethod
    def _row_to_dict(row) -> dict:
        d = dict(row)
        for k, v in d.items():
            if isinstance(v, (datetime, date)):
                d[k] = v.isoformat()
        return d

    async def _exec_select(self, conn) -> QueryResult:
        params = []
        where = self._build_where(params)
        order = self._build_order()
        limit = self._build_limit()
        count_val = None
        if self._count_mode:
            count_val = await conn.fetchval(f'SELECT COUNT(*) FROM "{self._table}" {where}', *params)
        rows = await conn.fetch(f'SELECT * FROM "{self._table}" {where} {order} {limit}', *params)
        data = [self._row_to_dict(r) for r in rows]
        if self._single:
            return QueryResult(data=data[0] if data else None, count=count_val)
        return QueryResult(data=data, count=count_val if count_val is not None else len(data))

    async def _exec_insert(self, conn) -> QueryResult:
        data = self._insert_data
        if not data: return QueryResult()
        cols = list(data.keys())
        vals = [data[c] for c in cols]
        phs = [f"${i+1}" for i in range(len(vals))]
        col_names = ", ".join(f'"{c}"' for c in cols)
        ph_str = ", ".join(phs)
        sql = f'INSERT INTO "{self._table}" ({col_names}) VALUES ({ph_str}) RETURNING *'
        row = await conn.fetchrow(sql, *vals)
        return QueryResult(data=self._row_to_dict(row) if row else None)

    async def _exec_update(self, conn) -> QueryResult:
        data = self._update_data
        if not data: return QueryResult()
        cols = list(data.keys())
        params = list(data.values())
        sets = [f'"{cols[i]}" = ${i+1}' for i in range(len(cols))]
        where = self._build_where(params)
        rows = await conn.fetch(f'UPDATE "{self._table}" SET {", ".join(sets)} {where} RETURNING *', *params)
        result = [self._row_to_dict(r) for r in rows]
        if self._single: return QueryResult(data=result[0] if result else None)
        return QueryResult(data=result)

    async def _exec_delete(self, conn) -> QueryResult:
        params = []
        where = self._build_where(params)
        rows = await conn.fetch(f'DELETE FROM "{self._table}" {where} RETURNING *', *params)
        return QueryResult(data=[self._row_to_dict(r) for r in rows])


class StorageBucket:
    def __init__(self, bucket):
        self._bucket = bucket

    def upload(self, path, file, file_options=None):
        return {"path": f"{self._bucket}/{path}"}

    def get_public_url(self, path):
        base = os.environ.get("APP_URL", "http://localhost:3000")
        return f"{base}/storage/{self._bucket}/{path}"

    def remove(self, paths):
        return {}


class StorageApi:
    def from_(self, bucket):
        return StorageBucket(bucket)


class AuthAdmin:
    """Stub for supabase.auth.admin methods."""
    def create_user(self, data):
        return type('R', (), {'user': type('U', (), {'id': None})()})()
    def delete_user(self, uid):
        pass
    def update_user_by_id(self, uid, data):
        return type('R', (), {'user': type('U', (), {'id': uid})()})()

class AuthStub:
    admin = AuthAdmin()

class CompatClient:
    """Drop-in replacement for supabase-py Client."""
    auth = AuthStub()

    def table(self, name: str) -> QueryBuilder:
        return QueryBuilder(name)

    @property
    def storage(self):
        return StorageApi()


_client: Optional[CompatClient] = None


def init_supabase() -> CompatClient:
    global _client
    if _client is None:
        _client = CompatClient()
    return _client


def get_supabase_client() -> CompatClient:
    return init_supabase()
