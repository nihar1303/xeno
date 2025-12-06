-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "shopify_store_domain" TEXT NOT NULL,
    "shopify_access_token" TEXT NOT NULL,
    "onboarding_status" TEXT NOT NULL DEFAULT 'SETUP_REQUIRED',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shopify_customer_id" BIGINT NOT NULL,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "created_at_shopify" TIMESTAMP(3),
    "updated_at_service" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "shopify_order_id" BIGINT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at_shopify" TIMESTAMP(3),
    "updated_at_service" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shopify_product_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at_shopify" TIMESTAMP(3),
    "updated_at_service" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_shopify_store_domain_key" ON "tenants"("shopify_store_domain");

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_shopify_customer_id_key" ON "customers"("tenant_id", "shopify_customer_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_idx" ON "orders"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_shopify_order_id_key" ON "orders"("tenant_id", "shopify_order_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "products"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_shopify_product_id_key" ON "products"("tenant_id", "shopify_product_id");

-- CreateIndex
CREATE INDEX "events_tenant_id_idx" ON "events"("tenant_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
