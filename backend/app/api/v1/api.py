from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.vendors import router as vendors_router
from app.api.v1.categories import router as categories_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.reports import router as reports_router
from app.api.v1.customers import router as customers_router
from app.api.v1.users import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents_router, prefix="/documents", tags=["Documents & Upload"])
api_router.include_router(invoices_router, prefix="/invoices", tags=["Invoices Ledger & Review"])
api_router.include_router(vendors_router, prefix="/vendors", tags=["Vendors"])
api_router.include_router(customers_router, prefix="/customers", tags=["Customers"])
api_router.include_router(users_router, prefix="/users", tags=["Staff & User Management"])
api_router.include_router(categories_router, prefix="/categories", tags=["Categories"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(reports_router, prefix="/reports", tags=["Reports & Export"])
