import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const MERCH_IMG =
  "https://cdn.poehali.dev/projects/a00ce720-a256-43b5-bf17-65d283f28886/files/40ce2d4d-b4a2-48c4-b60d-16b9a187eb5a.jpg";

const PRODUCTS_URL =
  "https://functions.poehali.dev/fb6908c1-60d1-469c-b7b9-bd4b5be6dcd2";
const CART_URL =
  "https://functions.poehali.dev/7dae185f-2a70-431e-bf49-77a9ea1567b2";
const ORDER_URL =
  "https://functions.poehali.dev/418e4ecb-1178-4a0c-a292-adfe705e5f52";

function getSessionId() {
  let sid = localStorage.getItem("shop_session");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("shop_session", sid);
  }
  return sid;
}

interface Product {
  id: number;
  name: string;
  price: number;
  tag: string | null;
  description: string | null;
  stock_limit: number | null;
  stock_left: number | null;
  image_url: string | null;
  coming_soon: boolean; // true = скоро будет
  release_date: string | null; // дата выхода
}
interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  tag: string | null;
  stock_left: number | null;
}

interface ShopSectionProps {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cartCount: number;
  setCartCount: (count: number) => void;
}

export default function ShopSection({
  cartOpen,
  setCartOpen,
  setCartCount,
}: ShopSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderDone, setOrderDone] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);
  const [orderForm, setOrderForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    comment: "",
  });
  const [orderLoading, setOrderLoading] = useState(false);

  const sid = getSessionId();

  const loadProducts = useCallback(async () => {
    const res = await fetch(PRODUCTS_URL);
    const data = await res.json();
    setProducts(data.products || []);
  }, []);

  const loadCart = useCallback(async () => {
    const res = await fetch(CART_URL, { headers: { "X-Session-Id": sid } });
    const data = await res.json();
    const items: CartItem[] = data.items || [];
    setCartItems(items);
    setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
  }, [sid, setCartCount]);

  useEffect(() => {
    loadProducts();
    loadCart();
  }, [loadProducts, loadCart]);

  const addToCart = async (productId: number) => {
    await fetch(CART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sid },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 1500);
    await loadCart();
    await loadProducts();
  };

  const removeFromCart = async (productId: number) => {
    await fetch(CART_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Session-Id": sid },
      body: JSON.stringify({ product_id: productId }),
    });
    await loadCart();
  };

  const submitOrder = async () => {
    if (!orderForm.name || !orderForm.email) return;
    setOrderLoading(true);
    const res = await fetch(ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sid },
      body: JSON.stringify(orderForm),
    });
    const data = await res.json();
    setOrderLoading(false);
    if (data.ok) {
      setOrderDone(data.order_id);
      setCartItems([]);
      setCartCount(0);
      setCheckoutOpen(false);
    }
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Разделяем товары
  const regularProducts = products.filter((p) => !p.coming_soon);
  const comingSoonProducts = products.filter((p) => p.coming_soon);

  return (
    <>
      {/* ─── МЕРЧ ─── */}
      <section
        id="мерч"
        className="relative py-24 px-8 md:px-16"
        style={{ background: "rgba(255,255,255,0.01)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="section-label mb-3">03 // мерч</div>
              <h2
                className="font-oswald text-white font-bold tracking-tight"
                style={{ fontSize: "clamp(40px, 7vw, 80px)" }}
              >
                МАГАЗИН
              </h2>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative hidden md:flex items-center gap-2 btn-neon"
            >
              <Icon name="ShoppingBag" size={16} />
              <span>Корзина {cartCount > 0 ? `(${cartCount})` : ""}</span>
            </button>
          </div>

          {/* Основная сетка товаров */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Баннер с новой коллекцией */}
            <div
              className="merch-card relative overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                aspectRatio: "1",
              }}
            >
              <img
                src={MERCH_IMG}
                alt="Мерч"
                className="w-full h-full object-cover img-hover-glitch"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(10,10,12,0.85) 0%, transparent 50%)",
                }}
              />
              <div className="absolute bottom-6 left-6">
                <div className="section-label mb-1">новая коллекция</div>
                <div className="font-oswald text-white text-2xl font-bold">
                  VOID SERIES 2026
                </div>
              </div>
            </div>

            {/* Доступные товары */}
            <div className="grid grid-cols-2">
              {regularProducts.map((item, i) => {
                const outOfStock =
                  item.stock_left !== null && item.stock_left <= 0;
                const isAdded = addedId === item.id;
                const inCart = cartItems.some((c) => c.product_id === item.id);
                return (
                  <div
                    key={item.id}
                    className="merch-card relative flex flex-col justify-between overflow-hidden"
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      minHeight: 180,
                      background:
                        i % 2 === 0 ? "rgba(15,15,18,1)" : "rgba(10,10,12,1)",
                    }}
                  >
                    {item.image_url && (
                      <div
                        className="w-full overflow-hidden"
                        style={{
                          aspectRatio: "1",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover img-hover-glitch"
                          style={{
                            filter: "grayscale(15%) contrast(1.1)",
                            opacity: outOfStock ? 0.4 : 1,
                          }}
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.tag && (
                          <span
                            className="inline-block px-2 py-1 font-mono-ibm self-start"
                            style={{
                              background:
                                item.tag === "ЛИМИТ"
                                  ? "#ff4040"
                                  : "var(--neon)",
                              color: "#000",
                              letterSpacing: "0.12em",
                              fontSize: "0.6rem",
                            }}
                          >
                            {item.tag}
                          </span>
                        )}
                        {item.stock_left !== null && item.stock_left > 0 && (
                          <span
                            className="inline-block px-2 py-1 font-mono-ibm self-start"
                            style={{
                              border: "1px solid #ff4040",
                              color: "#ff4040",
                              letterSpacing: "0.1em",
                              fontSize: "0.6rem",
                            }}
                          >
                            ОСТАЛОСЬ {item.stock_left}
                          </span>
                        )}
                        {outOfStock && (
                          <span
                            className="inline-block px-2 py-1 font-mono-ibm self-start"
                            style={{
                              border: "1px solid rgba(255,255,255,0.2)",
                              color: "rgba(255,255,255,0.3)",
                              letterSpacing: "0.1em",
                              fontSize: "0.6rem",
                            }}
                          >
                            РАСПРОДАНО
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-oswald text-white text-xl font-bold mb-1">
                          {item.name}
                        </div>
                        {item.description && (
                          <div
                            className="font-mono-ibm text-xs mb-2"
                            style={{
                              color: "rgba(255,255,255,0.3)",
                              fontSize: "0.65rem",
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                        <div className="font-mono-ibm text-lg neon-text">
                          {item.price.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                      <button
                        disabled={outOfStock}
                        onClick={() => !outOfStock && addToCart(item.id)}
                        className="btn-neon mt-4 self-start"
                        style={{
                          padding: "8px 20px",
                          fontSize: "0.65rem",
                          opacity: outOfStock ? 0.35 : 1,
                          background: isAdded ? "var(--neon)" : "",
                          color: isAdded ? "#000" : "",
                        }}
                      >
                        <span>
                          {isAdded
                            ? "✓ Добавлено"
                            : inCart
                              ? "Ещё раз"
                              : "В корзину"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── СКОРО БУДЕТ ─── */}
          {comingSoonProducts.length > 0 && (
            <div className="mt-16">
              <div className="mb-8 text-center">
                <div className="section-label mb-2">скоро</div>
                <h3
                  className="font-oswald text-white text-3xl font-bold tracking-wide"
                  style={{ textShadow: "0 0 10px rgba(176,48,255,0.3)" }}
                >
                  СКОРО БУДЕТ
                </h3>
                <div
                  className="w-20 h-px mx-auto mt-3"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--neon), transparent)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {comingSoonProducts.map((item) => (
                  <div
                    key={item.id}
                    className="relative group overflow-hidden rounded-lg"
                    style={{
                      background: "rgba(10,10,12,0.6)",
                      border: "1px solid rgba(176,48,255,0.2)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {/* Затемнённое изображение */}
                    {item.image_url && (
                      <div
                        className="w-full overflow-hidden"
                        style={{ aspectRatio: "1" }}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                          style={{ filter: "grayscale(30%) brightness(0.6)" }}
                        />
                      </div>
                    )}

                    {/* Оверлей с эффектом "скоро" */}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.5)" }}
                    >
                      <div className="text-center">
                        <div
                          className="font-oswald text-white text-2xl font-bold mb-2 tracking-wider"
                          style={{
                            textShadow: "0 0 20px rgba(176,48,255,0.8)",
                          }}
                        >
                          СКОРО
                        </div>
                        {item.release_date && (
                          <div
                            className="font-mono-ibm text-xs"
                            style={{ color: "rgba(176,48,255,0.8)" }}
                          >
                            {new Date(item.release_date).toLocaleDateString(
                              "ru-RU",
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Информация о товаре */}
                    <div
                      className="absolute bottom-0 left-0 right-0 p-4"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                      }}
                    >
                      <div className="font-oswald text-white text-lg font-bold">
                        {item.name}
                      </div>
                      {item.description && (
                        <div
                          className="font-mono-ibm text-xs"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── КОРЗИНА (DRAWER) ─── */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setCartOpen(false)}
        >
          <div
            className="h-full w-full max-w-md flex flex-col overflow-hidden"
            style={{
              background: "#0d0d10",
              borderLeft: "1px solid rgba(176,48,255,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="font-oswald text-white text-2xl font-bold tracking-wide">
                КОРЗИНА
              </div>
              <button onClick={() => setCartOpen(false)}>
                <Icon name="X" size={20} className="text-white" />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
                <Icon
                  name="ShoppingBag"
                  size={48}
                  style={{ color: "rgba(255,255,255,0.1)" }}
                />
                <div
                  className="font-mono-ibm text-sm"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Корзина пуста
                </div>
                <button onClick={() => setCartOpen(false)} className="btn-neon">
                  <span>К товарам</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-4"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-oswald text-white font-bold">
                          {item.name}
                        </div>
                        <div className="font-mono-ibm text-sm neon-text mt-1">
                          {(item.price * item.quantity).toLocaleString("ru-RU")}{" "}
                          ₽
                        </div>
                        <div
                          className="font-mono-ibm text-xs mt-1"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          × {item.quantity}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        style={{ color: "rgba(255,255,255,0.3)" }}
                        className="hover:text-white transition-colors"
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div
                  className="px-6 py-5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className="font-mono-ibm text-sm"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Итого
                    </span>
                    <span className="font-oswald text-white text-2xl font-bold">
                      {cartTotal.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                    className="btn-neon w-full justify-center"
                  >
                    <span>Оформить заказ</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── ОФОРМЛЕНИЕ ЗАКАЗА ─── */}
      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setCheckoutOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-y-auto"
            style={{
              background: "#0d0d10",
              border: "1px solid rgba(176,48,255,0.25)",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="font-oswald text-white text-xl font-bold tracking-wide">
                ОФОРМЛЕНИЕ ЗАКАЗА
              </div>
              <button onClick={() => setCheckoutOpen(false)}>
                <Icon name="X" size={20} className="text-white" />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {[
                {
                  key: "name",
                  label: "Имя *",
                  type: "text",
                  placeholder: "Как к тебе обращаться",
                },
                {
                  key: "email",
                  label: "Email *",
                  type: "email",
                  placeholder: "Для подтверждения заказа",
                },
                {
                  key: "phone",
                  label: "Телефон",
                  type: "tel",
                  placeholder: "+7 (___) ___-__-__",
                },
                {
                  key: "address",
                  label: "Адрес доставки",
                  type: "text",
                  placeholder: "Город, улица, дом, квартира",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label
                    className="font-mono-ibm text-xs mb-1 block"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={orderForm[f.key as keyof typeof orderForm]}
                    onChange={(e) =>
                      setOrderForm((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    className="w-full bg-transparent font-mono-ibm text-sm text-white outline-none px-3 py-2"
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                    }}
                  />
                </div>
              ))}
              <div>
                <label
                  className="font-mono-ibm text-xs mb-1 block"
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Комментарий
                </label>
                <textarea
                  placeholder="Пожелания к заказу"
                  value={orderForm.comment}
                  onChange={(e) =>
                    setOrderForm((p) => ({ ...p, comment: e.target.value }))
                  }
                  rows={2}
                  className="w-full bg-transparent font-mono-ibm text-sm text-white outline-none px-3 py-2 resize-none"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-oswald text-white text-xl font-bold">
                  {cartTotal.toLocaleString("ru-RU")} ₽
                </span>
                <button
                  disabled={orderLoading || !orderForm.name || !orderForm.email}
                  onClick={submitOrder}
                  className="btn-neon"
                  style={{
                    opacity: !orderForm.name || !orderForm.email ? 0.4 : 1,
                  }}
                >
                  <span>
                    {orderLoading ? "Отправляю..." : "Подтвердить заказ"}
                  </span>
                </button>
              </div>
              <div
                className="font-mono-ibm text-xs"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                * Оплата при получении или по договорённости. Мы свяжемся с
                тобой после оформления.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ЗАКАЗ ОФОРМЛЕН ─── */}
      {orderDone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setOrderDone(null)}
        >
          <div
            className="text-center px-8 py-12 max-w-sm"
            style={{ background: "#0d0d10", border: "1px solid var(--neon)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="font-oswald text-5xl mb-2"
              style={{ color: "var(--neon)" }}
            >
              ✓
            </div>
            <div className="font-oswald text-white text-2xl font-bold mb-3 tracking-wide">
              ЗАКАЗ ПРИНЯТ
            </div>
            <div
              className="font-mono-ibm text-sm mb-1"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Номер заказа: #{orderDone}
            </div>
            <div
              className="font-mono-ibm text-sm mb-6"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Ждём тебя. Скоро напишем.
            </div>
            <button onClick={() => setOrderDone(null)} className="btn-neon">
              <span>Закрыть</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
