import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const WHATSAPP_NUMBER = ""; // Ajoute ton numéro plus tard, format 2126XXXXXXXX

const [products, setProducts] = useState([]);
const [loadingProducts, setLoadingProducts] = useState(true);
const [productsError, setProductsError] = useState("");

useEffect(() => {
  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name_ar, name_fr, category, price_mad, stock_quantity, image_url, is_demo"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      setProductsError(error.message);
      setLoadingProducts(false);
      return;
    }

    setProducts(
      (data || []).map((p) => ({
        id: p.id,
        nameAr: p.name_ar,
        nameFr: p.name_fr,
        category: p.category,
        price: Number(p.price_mad),
        stock: p.stock_quantity,
        imageUrl: p.image_url,
        isDemo: p.is_demo,
        emoji: "🛠️",
      }))
    );

    setLoadingProducts(false);
  };

  loadProducts();
}, []);

const translations = {
  fr: {
    subtitle: "Votre partenaire en outillage professionnel",
    search: "Rechercher un outil...",
    all: "Tous les produits",
    perceuses: "Perceuses",
    meuleuses: "Meuleuses",
    outils: "Outils à main",
    securite: "Sécurité",
    products: "Nos produits",
    demo: "Catalogue de démonstration",
    stock: "En stock",
    add: "Ajouter au panier",
    cart: "Votre panier",
    empty: "Votre panier est vide.",
    total: "Total",
    order: "Commander sur WhatsApp",
    remove: "Retirer",
    contact: "Contactez-nous",
    delivery: "Livraison partout au Maroc selon conditions",
    footer: "Outillage professionnel au Maroc",
    configure: "Configurez votre numéro WhatsApp dans le fichier src/App.jsx avant de recevoir des commandes.",
    quantity: "Quantité",
  },
  ar: {
    subtitle: "شريككم في الأدوات والمعدات المهنية",
    search: "ابحث عن أداة...",
    all: "جميع المنتجات",
    perceuses: "آلات الحفر",
    meuleuses: "آلات الجلخ",
    outils: "الأدوات اليدوية",
    securite: "معدات السلامة",
    products: "منتجاتنا",
    demo: "كتالوج تجريبي",
    stock: "متوفر",
    add: "أضف إلى السلة",
    cart: "سلة المشتريات",
    empty: "السلة فارغة.",
    total: "المجموع",
    order: "اطلب عبر واتساب",
    remove: "حذف",
    contact: "اتصل بنا",
    delivery: "التوصيل إلى مدن المغرب حسب الشروط",
    footer: "معدات وأدوات مهنية في المغرب",
    configure: "أضف رقم واتساب الخاص بك في ملف src/App.jsx قبل استقبال الطلبات.",
    quantity: "الكمية",
  },
};

export default function App() {
  const [lang, setLang] = useState("fr");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const t = translations[lang];
  const isArabic = lang === "ar";

  const visibleProducts = products.filter((p) => {
    const name = isArabic ? p.nameAr : p.nameFr;
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const changeQuantity = (id, delta) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item;
          const product = products.find((p) => p.id === id);
          return {
            ...item,
            quantity: Math.min(
              product.stock,
              item.quantity + delta
            ),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const orderWhatsApp = () => {
    if (!WHATSAPP_NUMBER.trim()) {
      alert(t.configure);
      return;
    }

    const lines = cart.map(
      (item) =>
        `${isArabic ? item.nameAr : item.nameFr} x${item.quantity} = ${item.price * item.quantity} DH`
    );

    const message = [
      isArabic ? "السلام عليكم، أريد طلب المنتجات التالية:" : "Bonjour, je souhaite commander :",
      ...lines,
      `${t.total}: ${total} DH`,
      isArabic
        ? "الاسم:"
        : "Nom :",
      isArabic
        ? "المدينة والعنوان:"
        : "Ville et adresse :",
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const categories = [
    ["all", t.all],
    ["perceuses", t.perceuses],
    ["meuleuses", t.meuleuses],
    ["outils", t.outils],
    ["securite", t.securite],
  ];

  return (
    <div className={isArabic ? "app rtl" : "app"} dir={isArabic ? "rtl" : "ltr"}>
      <header className="header">
        <a className="brand" href="#">
          <span className="brand-icon">🛠️</span>
          <span>
            <strong>Outillage Maroc</strong>
            <small>أدوات المغرب</small>
          </span>
        </a>
        <div className="header-actions">
          <button className="lang-button" onClick={() => setLang(isArabic ? "fr" : "ar")}>
            {isArabic ? "Français" : "العربية"}
          </button>
          <a className="cart-link" href="#panier">
            🛒 <span>{cart.reduce((n, item) => n + item.quantity, 0)}</span>
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">OUTILLAGE • MAROC</span>
            <h1>{isArabic ? "كل ما تحتاجه من أدوات العمل" : "Les bons outils pour chaque chantier"}</h1>
            <p>{t.subtitle}</p>
            <a className="primary-button" href="#produits">
              {isArabic ? "اكتشف المنتجات" : "Découvrir les produits"} →
            </a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span>🔧</span>
            <span>🛠️</span>
            <span>⚙️</span>
          </div>
        </section>

        <section className="catalog" id="produits">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.demo}</span>
              <h2>{t.products}</h2>
            </div>
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              aria-label={t.search}
            />
          </div>

          <nav className="categories" aria-label="Categories">
            {categories.map(([id, label]) => (
              <button
                key={id}
                className={category === id ? "category active" : "category"}
                onClick={() => setCategory(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  <span>{product.emoji}</span>
                  <span className="demo-label">DEMO</span>
                </div>
                <div className="product-info">
                  <span className="product-category">
                    {t[product.category] || product.category}
                  </span>
                  <h3>{isArabic ? product.nameAr : product.nameFr}</h3>
                  <div className="product-bottom">
                    <strong>{product.price.toLocaleString()} DH</strong>
                    <small>{t.stock}: {product.stock}</small>
                  </div>
                  <button
                    className="add-button"
                    onClick={() => addToCart(product)}
                    disabled={
                      (cart.find((item) => item.id === product.id)?.quantity || 0)
                      >= product.stock
                    }
                  >
                    + {t.add}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {visibleProducts.length === 0 && (
            <p className="empty-message">
              {isArabic ? "لم يتم العثور على منتجات." : "Aucun produit trouvé."}
            </p>
          )}
        </section>

        <section className="cart-section" id="panier">
          <div className="cart-title">
            <span>🛒</span>
            <h2>{t.cart}</h2>
          </div>
          {cart.length === 0 ? (
            <p className="empty-message">{t.empty}</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-name">
                      <strong>{isArabic ? item.nameAr : item.nameFr}</strong>
                      <small>{item.price} DH / unité</small>
                    </div>
                    <div className="quantity-controls">
                      <button onClick={() => changeQuantity(item.id, -1)} aria-label="Diminuer">−</button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => changeQuantity(item.id, 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Augmenter"
                      >+</button>
                    </div>
                    <strong>{item.price * item.quantity} DH</strong>
                    <button className="remove-button" onClick={() => setCart((c) => c.filter((p) => p.id !== item.id))}>
                      {t.remove}
                    </button>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <span>{t.total}</span>
                <strong>{total.toLocaleString()} DH</strong>
              </div>
              <button className="whatsapp-button" onClick={orderWhatsApp}>
                <span>◉</span> {t.order}
              </button>
            </>
          )}
        </section>

        <section className="delivery-note">
          <span>🚚</span>
          <p>{t.delivery}</p>
        </section>
      </main>

      <footer className="footer">
        <strong>Outillage Maroc</strong>
        <p>{t.footer}</p>
        <small>© {new Date().getFullYear()} Outillage Maroc</small>
      </footer>
    </div>
  );
}
