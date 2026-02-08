from __future__ import annotations

import uuid
import os
import logging
from enum import Enum as PyEnum
from typing import Any, Dict, List, Optional

import redis
import stripe

# Algolia import defensivo (SDK v4 usa algoliasearch.search.client)
try:
    from algoliasearch.search.client import SearchClient  # type: ignore
except Exception:  # pragma: no cover - fallback se SDK ausente
    SearchClient = None
from fastapi import FastAPI, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    ForeignKey,
    DateTime,
    Enum as SAEnum,
    UniqueConstraint,
    text,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from database import Base, engine, get_db

# =========================
# ENV / PROVIDERS
# =========================
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
logger = logging.getLogger("belapop.webhook")

PAGARME_API_KEY = os.getenv("PAGARME_API_KEY")
PAGARME_ENCRYPTION_KEY = os.getenv("PAGARME_ENCRYPTION_KEY")
PAGARME_BASE_URL = os.getenv("PAGARME_BASE_URL", "https://api.pagar.me/core/v5")
PAGARME_MODE = os.getenv("PAGARME_MODE", "mock")

MELHOR_ENVIO_TOKEN = os.getenv("MELHOR_ENVIO_TOKEN")
MELHOR_ENVIO_BASE_URL = os.getenv("MELHOR_ENVIO_BASE_URL", "https://sandbox.melhorenvio.com.br/api/v2")
MELHOR_ENVIO_MODE = os.getenv("MELHOR_ENVIO_MODE", "mock")

ALGOLIA_APP_ID = os.getenv("ALGOLIA_APP_ID")
ALGOLIA_API_KEY = os.getenv("ALGOLIA_API_KEY")
ALGOLIA_INDEX_PRODUCTS = os.getenv("ALGOLIA_INDEX_PRODUCTS", "products")
algolia_client = (
    SearchClient.create(ALGOLIA_APP_ID, ALGOLIA_API_KEY)
    if SearchClient and ALGOLIA_APP_ID and ALGOLIA_API_KEY
    else None
)
algolia_index = algolia_client.init_index(ALGOLIA_INDEX_PRODUCTS) if algolia_client else None

REDIS_URL = os.getenv("REDIS_URL")
redis_client = redis.from_url(REDIS_URL) if REDIS_URL else None

# =========================
# ENUMS
# =========================
class UserRole(str, PyEnum):
    customer = "customer"
    seller = "seller"
    admin = "admin"


class OrderStatus(str, PyEnum):
    pending = "pending"
    paid = "paid"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    refunded = "refunded"


class ShipmentStatus(str, PyEnum):
    pending = "pending"
    label_created = "label_created"
    in_transit = "in_transit"
    delivered = "delivered"
    cancelled = "cancelled"
    returned = "returned"


class PaymentStatus(str, PyEnum):
    pending = "pending"
    authorized = "authorized"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"
    chargeback = "chargeback"


# =========================
# MODELS
# =========================
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.customer)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Store(Base):
    __tablename__ = "stores"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price_cents = Column(Integer, nullable=False)
    currency = Column(String, nullable=False, default="BRL")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Cart(Base):
    __tablename__ = "carts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price_cents = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),)


class Order(Base):
    __tablename__ = "orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum(OrderStatus), nullable=False, default=OrderStatus.pending)
    subtotal_cents = Column(Integer, nullable=False, default=0)
    shipping_cents = Column(Integer, nullable=False, default=0)
    discount_cents = Column(Integer, nullable=False, default=0)
    total_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String, nullable=False, default="BRL")
    shipping_address_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    title_snapshot = Column(String, nullable=False)
    unit_price_cents = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    line_total_cents = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    status = Column(SAEnum(ShipmentStatus), nullable=False, default=ShipmentStatus.pending)
    shipping_cents = Column(Integer, nullable=False, default=0)
    carrier = Column(String, nullable=True)
    service_level = Column(String, nullable=True)
    tracking_code = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint("order_id", "store_id", name="uq_order_store"),)


class ShipmentItem(Base):
    __tablename__ = "shipment_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False)
    order_item_id = Column(UUID(as_uuid=True), ForeignKey("order_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    __table_args__ = (UniqueConstraint("shipment_id", "order_item_id", name="uq_shipment_item"),)


class Payment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, unique=True)
    status = Column(SAEnum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String, nullable=False, default="BRL")
    provider = Column(String, nullable=True)
    provider_ref = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Promotion(Base):
    __tablename__ = "promotions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, nullable=False, unique=True)
    percent_off = Column(Integer, nullable=True)  # 0-100
    amount_off_cents = Column(Integer, nullable=True)
    min_subtotal_cents = Column(Integer, nullable=True, default=0)
    is_active = Column(Boolean, default=True)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Review(Base):
    __tablename__ = "reviews"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5
    title = Column(String, nullable=True)
    body = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String, nullable=False)
    event_id = Column(String, nullable=False, unique=True)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OrderStoreTotals(Base):
    __tablename__ = "order_store_totals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    subtotal_cents = Column(Integer, nullable=False, default=0)
    shipping_cents = Column(Integer, nullable=False, default=0)
    discount_cents = Column(Integer, nullable=False, default=0)
    total_cents = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("order_id", "store_id", name="uq_order_store_totals"),)


# =========================
# SCHEMAS
# =========================
class UserCreate(BaseModel):
    role: UserRole = UserRole.customer
    name: str
    email: str


class UserOut(BaseModel):
    id: uuid.UUID
    role: UserRole
    name: str
    email: str

    class Config:
        from_attributes = True


class StoreCreate(BaseModel):
    owner_user_id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None


class StoreOut(BaseModel):
    id: uuid.UUID
    owner_user_id: uuid.UUID
    name: str
    slug: str

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    store_id: uuid.UUID
    title: str
    description: Optional[str] = None
    price_cents: int = Field(ge=0)


class ProductOut(BaseModel):
    id: uuid.UUID
    store_id: uuid.UUID
    title: str
    price_cents: int

    class Config:
        from_attributes = True


class CartItemAdd(BaseModel):
    user_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int = Field(ge=1)


class CartItemUpdate(BaseModel):
    user_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int = Field(ge=0)


class CartItemLine(BaseModel):
    product_id: uuid.UUID
    title: str
    store_id: uuid.UUID
    store_slug: str
    unit_price_cents: int
    quantity: int
    line_total_cents: int


class CartView(BaseModel):
    user_id: uuid.UUID
    subtotal_cents: int
    by_store: Dict[str, Any]


class QuoteRequest(BaseModel):
    user_id: uuid.UUID
    postal_code: str = Field(min_length=5, max_length=15)


class QuoteStoreLine(BaseModel):
    store_id: uuid.UUID
    store_slug: str
    items_subtotal_cents: int
    shipping_cents: int
    total_cents: int


class QuoteResponse(BaseModel):
    user_id: uuid.UUID
    subtotal_cents: int
    shipping_cents: int
    total_cents: int
    stores: List[QuoteStoreLine]


class CheckoutRequest(BaseModel):
    user_id: uuid.UUID
    postal_code: str = Field(min_length=5, max_length=15)
    provider: str = "mockpay"
    coupon_code: Optional[str] = None
    payment_method: Optional[str] = "pix"
    customer: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None


class CheckoutResponse(BaseModel):
    order_id: uuid.UUID
    payment_id: uuid.UUID
    status: OrderStatus
    total_cents: int
    shipments: List[Dict[str, Any]]
    payment_details: Optional[Dict[str, Any]] = None


class PaymentUpdate(BaseModel):
    status: PaymentStatus
    provider_ref: Optional[str] = None


class PromotionApplyRequest(BaseModel):
    user_id: uuid.UUID
    code: str


class PromotionOut(BaseModel):
    code: str
    percent_off: Optional[int] = None
    amount_off_cents: Optional[int] = None
    applied_discount_cents: int


class PromotionCreate(BaseModel):
    code: str
    percent_off: Optional[int] = Field(default=None, ge=0, le=100)
    amount_off_cents: Optional[int] = Field(default=None, ge=0)
    min_subtotal_cents: Optional[int] = Field(default=0, ge=0)


class ReviewCreate(BaseModel):
    user_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    body: Optional[str] = None


class ReviewOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    rating: int
    title: Optional[str]
    body: Optional[str]
    is_verified: bool
    created_at: str

    class Config:
        from_attributes = True


class StripeCheckoutResponse(BaseModel):
    order_id: uuid.UUID
    payment_id: uuid.UUID
    amount_cents: int
    currency: str
    client_secret: str


# =========================
# HELPERS
# =========================
def get_or_create_cart(db: Session, user_id: uuid.UUID) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if cart:
        return cart
    cart = Cart(user_id=user_id)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def require_user(db: Session, user_id: uuid.UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")
    return user


def require_product(db: Session, product_id: uuid.UUID) -> Product:
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(404, "Produto não encontrado/ativo")
    return product


def require_store(db: Session, store_id: uuid.UUID) -> Store:
    store = (
        db.query(Store)
        .filter(Store.id == store_id, Store.is_active == True)
        .first()
    )
    if not store:
        raise HTTPException(404, "Loja não encontrada/ativa")
    return store


def cart_view(db: Session, user_id: uuid.UUID) -> CartView:
    require_user(db, user_id)
    cart = get_or_create_cart(db, user_id)
    rows = db.execute(
        text(
            """
        SELECT
          ci.product_id,
          p.title,
          p.store_id,
          s.slug AS store_slug,
          ci.unit_price_cents,
          ci.quantity
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        JOIN stores s ON s.id = p.store_id
        WHERE ci.cart_id = :cart_id
        ORDER BY s.slug, p.title
    """
        ),
        {"cart_id": str(cart.id)},
    ).fetchall()

    by_store: Dict[str, Any] = {}
    subtotal = 0

    for row in rows:
        line_total = int(row.unit_price_cents) * int(row.quantity)
        subtotal += line_total
        slug = str(row.store_slug)
        if slug not in by_store:
            by_store[slug] = {
                "store_id": row.store_id,
                "store_slug": slug,
                "items": [],
                "subtotal_cents": 0,
            }
        entry = by_store[slug]
        entry["items"].append(
            {
                "product_id": row.product_id,
                "title": row.title,
                "store_id": row.store_id,
                "store_slug": slug,
                "unit_price_cents": int(row.unit_price_cents),
                "quantity": int(row.quantity),
                "line_total_cents": line_total,
            }
        )
        entry["subtotal_cents"] += line_total

    return CartView(user_id=user_id, subtotal_cents=subtotal, by_store=by_store)


def shipping_quote_for_store(postal_code: str, store_subtotal_cents: int, item_count: int) -> int:
    # Melhor Envio (scaffold): se token existir, tente usar cotação real no futuro.
    quote = melhor_envio_quote(postal_code, store_subtotal_cents, item_count)
    if quote is not None:
        return quote
    if store_subtotal_cents >= 15000:
        return 0
    base = 1290
    per_item = 200 * max(item_count, 1)
    return base + per_item


def melhor_envio_quote(postal_code: str, store_subtotal_cents: int, item_count: int) -> Optional[int]:
    """
    Scaffold para integrar Melhor Envio.
    Retorna None quando não configurado para cair no fallback.
    """
    if MELHOR_ENVIO_MODE != "real" and not MELHOR_ENVIO_TOKEN:
        # mock: usa fórmula simples para manter o fluxo funcionando
        base = 1290
        per_item = 200 * max(item_count, 1)
        return base + per_item
    if not MELHOR_ENVIO_TOKEN:
        return None
    # TODO: Implementar chamada real ao Melhor Envio (cotação por pacote/serviço).
    return None


def pagarme_create_payment_stub(
    order: Order,
    payment_method: str,
    customer: Optional[Dict[str, Any]] = None,
    shipping_address: Optional[Dict[str, Any]] = None,
) -> tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    Scaffold Pagar.me: retorna provider_ref + detalhes mesmo sem chaves.
    """
    if PAGARME_MODE != "real" or not PAGARME_API_KEY:
        provider_ref = f"pagarme_mock_{order.id}"
        if payment_method == "boleto":
            details = {
                "method": "boleto",
                "boleto_url": "https://sandbox.pagar.me/boleto/mock",
                "boleto_barcode": "00000000000000000000000000000000000000000000000000",
            }
        elif payment_method == "credit_card":
            details = {"method": "credit_card", "status": "authorized"}
        else:
            details = {
                "method": "pix",
                "pix_qr_code": "00020101021226860014BR.GOV.BCB.PIX0136mock-pagarme-qr-code5204000053039865802BR5921BELAPOP MOCK PAYMENT6009SAO PAULO62070503***6304B13F",
                "pix_expires_at": None,
            }
        return provider_ref, details
    # TODO: Implementar criação de cobrança real no Pagar.me (Pix/Boleto/Cartão + split).
    return None, None


def apply_promotion(db: Session, subtotal_cents: int, code: Optional[str]) -> int:
    """
    Returns discount_cents applied for the order.
    """
    if not code:
        return 0
    promo = (
        db.query(Promotion)
        .filter(Promotion.code.ilike(code), Promotion.is_active == True)
        .first()
    )
    if not promo:
        raise HTTPException(400, "Cupom inválido ou inativo")
    if promo.min_subtotal_cents and subtotal_cents < promo.min_subtotal_cents:
        raise HTTPException(400, "Subtotal não atinge o mínimo do cupom")
    discount = 0
    if promo.percent_off:
        discount += int(subtotal_cents * promo.percent_off / 100)
    if promo.amount_off_cents:
        discount += int(promo.amount_off_cents)
    return min(discount, subtotal_cents)


def index_product_algolia(product: Product):
    if not algolia_index:
        return
    payload = {
        "objectID": str(product.id),
        "title": product.title,
        "description": product.description,
        "price_cents": product.price_cents,
        "store_id": str(product.store_id),
        "is_active": product.is_active,
        "created_at": product.created_at.isoformat() if product.created_at else None,
    }
    algolia_index.save_object(payload)


def remove_product_algolia(product_id: uuid.UUID):
    if not algolia_index:
        return
    algolia_index.delete_object(str(product_id))


def user_has_delivered_order_with_product(db: Session, user_id: uuid.UUID, product_id: uuid.UUID) -> Optional[uuid.UUID]:
    row = db.execute(
        text(
            """
        SELECT o.id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = :user_id
          AND oi.product_id = :product_id
          AND o.status IN ('delivered', 'paid')
        LIMIT 1
    """
        ),
        {"user_id": str(user_id), "product_id": str(product_id)},
    ).fetchone()
    return uuid.UUID(str(row[0])) if row else None


def quote(db: Session, user_id: uuid.UUID, postal_code: str) -> QuoteResponse:
    cv = cart_view(db, user_id)
    if cv.subtotal_cents == 0:
        raise HTTPException(400, "Carrinho vazio")

    stores: List[QuoteStoreLine] = []
    shipping_total = 0

    for slug, payload in cv.by_store.items():
        store_subtotal = int(payload["subtotal_cents"])
        item_count = sum(int(item["quantity"]) for item in payload["items"])
        ship = shipping_quote_for_store(postal_code, store_subtotal, item_count)
        shipping_total += ship
        stores.append(
            QuoteStoreLine(
                store_id=payload["store_id"],
                store_slug=slug,
                items_subtotal_cents=store_subtotal,
                shipping_cents=ship,
                total_cents=store_subtotal + ship,
            )
        )

    total = cv.subtotal_cents + shipping_total
    return QuoteResponse(
        user_id=user_id,
        subtotal_cents=cv.subtotal_cents,
        shipping_cents=shipping_total,
        total_cents=total,
        stores=stores,
    )


def enqueue_payment_event(db: Session, event_id: str, event_type: str, payload: dict):
    """
    Publica em fila externa se REDIS_URL existir; senão, processa inline.
    """
    # Registrar idempotência local
    exists = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
    if exists:
        return
    record = WebhookEvent(
        provider="stripe",
        event_id=event_id,
        event_type=event_type,
        payload=payload,
    )
    db.add(record)
    db.commit()

    if redis_client:
        redis_client.lpush(
            "webhook_events",
            {
                "event_id": event_id,
                "event_type": event_type,
                "payload": payload,
            },
        )
    else:
        process_payment_event(db, event_type, payload)


def process_payment_event(db: Session, event_type: str, obj: dict):
    metadata = obj.get("metadata") or {}
    payment_id = metadata.get("payment_id")
    order_id = metadata.get("order_id")
    if not payment_id or not order_id:
        return
    payment = db.query(Payment).filter(Payment.id == uuid.UUID(payment_id)).first()
    order = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    if not payment or not order:
        return

    if event_type == "payment_intent.succeeded":
        payment.status = PaymentStatus.paid
        order.status = OrderStatus.paid
        payment.provider_ref = obj.get("id")
    elif event_type == "payment_intent.payment_failed":
        payment.status = PaymentStatus.failed
        order.status = OrderStatus.cancelled
    elif event_type == "charge.refunded":
        payment.status = PaymentStatus.refunded
        order.status = OrderStatus.refunded
    db.commit()


def checkout_create_order(
    db: Session,
    user_id: uuid.UUID,
    postal_code: str,
    provider: str,
    coupon_code: Optional[str] = None,
    payment_method: Optional[str] = None,
    customer: Optional[Dict[str, Any]] = None,
    shipping_address: Optional[Dict[str, Any]] = None,
) -> CheckoutResponse:
    cv = cart_view(db, user_id)
    if cv.subtotal_cents == 0:
        raise HTTPException(400, "Carrinho vazio")

    q = quote(db, user_id, postal_code)
    discount_cents = apply_promotion(db, q.subtotal_cents, coupon_code)
    total_after_discount = max(q.total_cents - discount_cents, 0)
    order = Order(
        user_id=user_id,
        status=OrderStatus.pending,
        subtotal_cents=q.subtotal_cents,
        shipping_cents=q.shipping_cents,
        discount_cents=discount_cents,
        total_cents=total_after_discount,
        currency="BRL",
    )
    db.add(order)
    db.flush()

    shipment_map: Dict[uuid.UUID, Shipment] = {}
    shipments_out: List[Dict[str, Any]] = []

    for store_line in q.stores:
        s_id = uuid.UUID(str(store_line.store_id))
        sh = Shipment(
            order_id=order.id,
            store_id=s_id,
            status=ShipmentStatus.pending,
            shipping_cents=int(store_line.shipping_cents),
        )
        db.add(sh)
        db.flush()
        shipment_map[s_id] = sh

        ost = OrderStoreTotals(
            order_id=order.id,
            store_id=s_id,
            subtotal_cents=int(store_line.items_subtotal_cents),
            shipping_cents=int(store_line.shipping_cents),
            discount_cents=0,
            total_cents=int(store_line.total_cents),
        )
        db.add(ost)

    for slug, payload in cv.by_store.items():
        s_id = uuid.UUID(str(payload["store_id"]))
        sh = shipment_map[s_id]
        for item in payload["items"]:
            product_id = uuid.UUID(str(item["product_id"]))
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise HTTPException(400, "Produto sumiu do catálogo. Atualize o carrinho.")

            qty = int(item["quantity"])
            unit = int(item["unit_price_cents"])
            line_total = unit * qty

            oi = OrderItem(
                order_id=order.id,
                store_id=s_id,
                product_id=product_id,
                title_snapshot=item["title"],
                unit_price_cents=unit,
                quantity=qty,
                line_total_cents=line_total,
            )
            db.add(oi)
            db.flush()

            si = ShipmentItem(
                shipment_id=sh.id,
                order_item_id=oi.id,
                quantity=qty,
            )
            db.add(si)

    payment = Payment(
        order_id=order.id,
        status=PaymentStatus.pending,
        amount_cents=order.total_cents,
        currency="BRL",
        provider=provider,
    )
    db.add(payment)
    db.flush()

    if provider == "pagarme":
        provider_ref, payment_details = pagarme_create_payment_stub(
            order,
            payment_method or "pix",
            customer,
            shipping_address,
        )
        if provider_ref:
            payment.provider_ref = provider_ref

    cart = get_or_create_cart(db, user_id)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    db.commit()
    db.refresh(order)
    db.refresh(payment)

    for store_line in q.stores:
        shipments_out.append(
            {
                "store_id": str(store_line.store_id),
                "store_slug": store_line.store_slug,
                "shipping_cents": int(store_line.shipping_cents),
                "status": ShipmentStatus.pending,
            }
        )

    return CheckoutResponse(
        order_id=order.id,
        payment_id=payment.id,
        status=order.status,
        total_cents=order.total_cents,
        shipments=shipments_out,
        payment_details=payment_details if provider == "pagarme" else None,
    )


# =========================
# APP
# =========================
app = FastAPI(title="BelaPop Marketplace API")

# criar tabelas
Base.metadata.create_all(bind=engine)


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "connected"}


@app.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(400, "Email já cadastrado")
    user = User(role=payload.role, name=payload.name, email=payload.email)
    db.add(user)
    db.commit()
    db.refresh(user)
    get_or_create_cart(db, user.id)
    return user


@app.post("/stores", response_model=StoreOut)
def create_store(payload: StoreCreate, db: Session = Depends(get_db)):
    require_user(db, payload.owner_user_id)
    exists = db.query(Store).filter(Store.slug == payload.slug).first()
    if exists:
        raise HTTPException(400, "Slug já existe")
    store = Store(
        owner_user_id=payload.owner_user_id,
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@app.post("/products", response_model=ProductOut)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    require_store(db, payload.store_id)
    product = Product(
        store_id=payload.store_id,
        title=payload.title,
        description=payload.description,
        price_cents=payload.price_cents,
        currency="BRL",
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    index_product_algolia(product)
    return product


@app.post("/promotions")
def create_promotion(payload: PromotionCreate, db: Session = Depends(get_db)):
    exists = db.query(Promotion).filter(Promotion.code.ilike(payload.code)).first()
    if exists:
        raise HTTPException(400, "Código de cupom já existe")
    promo = Promotion(
        code=payload.code.upper(),
        percent_off=payload.percent_off,
        amount_off_cents=payload.amount_off_cents,
        min_subtotal_cents=payload.min_subtotal_cents or 0,
        is_active=True,
    )
    db.add(promo)
    db.commit()
    return {
        "id": str(promo.id),
        "code": promo.code,
        "percent_off": promo.percent_off,
        "amount_off_cents": promo.amount_off_cents,
        "min_subtotal_cents": promo.min_subtotal_cents,
        "is_active": promo.is_active,
    }


@app.get("/promotions")
def list_promotions(db: Session = Depends(get_db)):
    promos = db.query(Promotion).order_by(Promotion.created_at.desc()).all()
    return [
        {
            "id": str(p.id),
            "code": p.code,
            "percent_off": p.percent_off,
            "amount_off_cents": p.amount_off_cents,
            "min_subtotal_cents": p.min_subtotal_cents,
            "is_active": p.is_active,
        }
        for p in promos
    ]


@app.get("/products", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return (
        db.query(Product)
        .filter(Product.is_active == True)
        .order_by(Product.created_at.desc())
        .all()
    )


@app.get("/search/products", response_model=List[ProductOut])
def search_products(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if algolia_index:
        res = algolia_index.search(q or "", {"hitsPerPage": 24})
        hits = res.get("hits", [])
        return [
            ProductOut(
                id=hit["objectID"],
                store_id=hit.get("store_id"),
                title=hit.get("title"),
                price_cents=hit.get("price_cents"),
            )
            for hit in hits
        ]
    query = db.query(Product).filter(Product.is_active == True)
    if q:
        like = f"%{q}%"
        query = query.filter(Product.title.ilike(like))
    return query.order_by(Product.created_at.desc()).limit(24).all()


@app.post("/cart/items")
def cart_add(payload: CartItemAdd, db: Session = Depends(get_db)):
    require_user(db, payload.user_id)
    product = require_product(db, payload.product_id)
    cart = get_or_create_cart(db, payload.user_id)
    item = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id, CartItem.product_id == payload.product_id)
        .first()
    )
    if item:
        item.quantity += payload.quantity
        item.unit_price_cents = product.price_cents
    else:
        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=payload.product_id,
                quantity=payload.quantity,
                unit_price_cents=product.price_cents,
            )
        )
    db.commit()
    return {"ok": True}


@app.patch("/cart/items")
def cart_update(payload: CartItemUpdate, db: Session = Depends(get_db)):
    require_user(db, payload.user_id)
    cart = get_or_create_cart(db, payload.user_id)
    item = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id, CartItem.product_id == payload.product_id)
        .first()
    )
    if not item:
        raise HTTPException(404, "Item não existe no carrinho")
    if payload.quantity == 0:
        db.delete(item)
    else:
        item.quantity = payload.quantity
    db.commit()
    return {"ok": True}


@app.get("/cart/{user_id}", response_model=CartView)
def cart_get(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return cart_view(db, user_id)


@app.post("/checkout/quote", response_model=QuoteResponse)
def checkout_quote(payload: QuoteRequest, db: Session = Depends(get_db)):
    return quote(db, payload.user_id, payload.postal_code)


@app.post("/checkout", response_model=CheckoutResponse)
def checkout(payload: CheckoutRequest, db: Session = Depends(get_db)):
    return checkout_create_order(
        db,
        payload.user_id,
        payload.postal_code,
        payload.provider,
        payload.coupon_code,
        payload.payment_method,
        payload.customer,
        payload.shipping_address,
    )


@app.post("/checkout/stripe-intent", response_model=StripeCheckoutResponse)
def checkout_stripe(payload: CheckoutRequest, db: Session = Depends(get_db)):
    if not stripe.api_key:
        raise HTTPException(500, "Stripe não configurado")

    result = checkout_create_order(
        db,
        payload.user_id,
        payload.postal_code,
        provider="stripe",
        coupon_code=payload.coupon_code,
    )

    order = db.query(Order).filter(Order.id == result.order_id).first()
    payment = db.query(Payment).filter(Payment.id == result.payment_id).first()
    if not order or not payment:
        raise HTTPException(500, "Erro ao criar pedido")

    intent = stripe.PaymentIntent.create(
        amount=order.total_cents,
        currency=order.currency.lower(),
        automatic_payment_methods={"enabled": True},
        metadata={
            "order_id": str(order.id),
            "user_id": str(order.user_id),
            "payment_id": str(payment.id),
        },
    )

    payment.provider = "stripe"
    payment.provider_ref = intent.id
    db.commit()

    return StripeCheckoutResponse(
        order_id=order.id,
        payment_id=payment.id,
        amount_cents=order.total_cents,
        currency=order.currency.lower(),
        client_secret=intent.client_secret,
    )


@app.patch("/payments/{order_id}")
def payment_update(order_id: uuid.UUID, payload: PaymentUpdate, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(404, "Payment não encontrado")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order não encontrado")
    payment.status = payload.status
    if payload.provider_ref:
        payment.provider_ref = payload.provider_ref
    if payload.status == PaymentStatus.paid:
        order.status = OrderStatus.paid
    elif payload.status in (PaymentStatus.failed, PaymentStatus.chargeback):
        order.status = OrderStatus.cancelled
    elif payload.status == PaymentStatus.refunded:
        order.status = OrderStatus.refunded
    db.commit()
    return {"ok": True, "payment_status": payment.status, "order_status": order.status}


@app.post("/payments/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(500, "Webhook secret nao configurado")
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    if not sig:
        logger.warning("Stripe webhook sem assinatura (stripe-signature ausente)")
    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=sig, secret=STRIPE_WEBHOOK_SECRET
        )
    except Exception as exc:
        logger.exception("Webhook invalido (falha na verificacao de assinatura)")
        raise HTTPException(400, f"Webhook invalido: {exc}")

    event_type = event["type"]
    obj = event["data"]["object"]
    event_id = event.get("id")

    if not event_id:
        return {"received": True}

    # Idempotência + processamento (stub de fila)
    enqueue_payment_event(db, event_id, event_type, obj)
    return {"received": True}


@app.get("/orders/{order_id}")
def order_get(order_id: uuid.UUID, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    shipments = db.query(Shipment).filter(Shipment.order_id == order_id).all()
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    store_totals = (
        db.query(OrderStoreTotals).filter(OrderStoreTotals.order_id == order_id).all()
    )
    return {
        "order": {
            "id": str(order.id),
            "user_id": str(order.user_id),
            "status": order.status,
            "subtotal_cents": order.subtotal_cents,
            "shipping_cents": order.shipping_cents,
            "discount_cents": order.discount_cents,
            "total_cents": order.total_cents,
            "created_at": str(order.created_at),
        },
        "items": [
            {
                "id": str(item.id),
                "store_id": str(item.store_id),
                "product_id": str(item.product_id),
                "title": item.title_snapshot,
                "unit_price_cents": item.unit_price_cents,
                "quantity": item.quantity,
                "line_total_cents": item.line_total_cents,
            }
            for item in items
        ],
        "shipments": [
            {
                "id": str(sh.id),
                "store_id": str(sh.store_id),
                "status": sh.status,
                "shipping_cents": sh.shipping_cents,
                "carrier": sh.carrier,
                "service_level": sh.service_level,
                "tracking_code": sh.tracking_code,
            }
            for sh in shipments
        ],
        "payment": None
        if not payment
        else {
            "id": str(payment.id),
            "status": payment.status,
            "amount_cents": payment.amount_cents,
            "provider": payment.provider,
            "provider_ref": payment.provider_ref,
        },
        "store_totals": [
            {
                "store_id": str(st.store_id),
                "subtotal_cents": st.subtotal_cents,
                "shipping_cents": st.shipping_cents,
                "discount_cents": st.discount_cents,
                "total_cents": st.total_cents,
            }
            for st in store_totals
        ],
    }


@app.post("/products/{product_id}/reviews", response_model=ReviewOut)
def create_review(product_id: uuid.UUID, payload: ReviewCreate, db: Session = Depends(get_db)):
    require_product(db, product_id)
    require_user(db, payload.user_id)
    order_id = user_has_delivered_order_with_product(db, payload.user_id, product_id)
    review = Review(
        product_id=product_id,
        user_id=payload.user_id,
        order_id=order_id,
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
        is_verified=bool(order_id),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewOut.from_orm(review)


@app.get("/products/{product_id}/reviews", response_model=List[ReviewOut])
def list_reviews(product_id: uuid.UUID, db: Session = Depends(get_db)):
    require_product(db, product_id)
    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [ReviewOut.from_orm(r) for r in reviews]
