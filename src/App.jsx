import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronDown,
  CircleUserRound,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "./firebase";

const wilayas = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
  "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة",
  "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
  "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة",
  "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", "تيميمون",
  "برج باجي مختار", "أولاد جلال", "بني عباس", "عين صالح", "عين قزام", "تقرت", "جانت", "المغير", "المنيعة",
];

const demoProducts = [
  {
    id: "demo-1",
    name: "سماعات لاسلكية برو",
    category: "إلكترونيات",
    description: "صوت نقي وعزل للضوضاء مع بطارية تدوم طوال اليوم. تصميم مريح للاستعمال اليومي.",
    price: 8900,
    oldPrice: 11900,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
    badge: "الأكثر مبيعاً",
  },
  {
    id: "demo-2",
    name: "ساعة كلاسيكية أنيقة",
    category: "إكسسوارات",
    description: "ساعة بتصميم minimal أنيق وسوار متين، تناسب إطلالتك اليومية والمناسبات.",
    price: 12500,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
    badge: "اختيارنا",
  },
  {
    id: "demo-3",
    name: "حقيبة يومية مميزة",
    category: "أزياء",
    description: "مساحة عملية وخامات عالية الجودة. خيارك المثالي للعمل والتنقل والسفر.",
    price: 7400,
    oldPrice: 9200,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
    badge: "عرض خاص",
  },
  {
    id: "demo-4",
    name: "مصباح مكتبي عصري",
    category: "المنزل",
    description: "إضاءة مريحة للعين بسطوع قابل للتعديل، تضيف لمسة هادئة لمساحة عملك.",
    price: 5600,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    badge: "",
  },
];

const money = (amount) =>
  new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(Number(amount) || 0);

function App() {
  const [products, setProducts] = useState(demoProducts);
  const [productsError, setProductsError] = useState("");
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderItems, setOrderItems] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");

  useEffect(() => {
    if (!db) return undefined;
    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    return onSnapshot(
      productsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        setProducts(items);
        setProductsError("");
      },
      (error) => {
        console.error("تعذر تحميل المنتجات من Firestore:", error);
        setProductsError("تعذر تحميل المنتجات من قاعدة البيانات. تحقق من إعدادات Firestore وقواعد الوصول.");
      },
    );
  }, []);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        return;
      }
      try {
        const token = await nextUser.getIdTokenResult(true);
        setIsAdmin(token.claims.admin === true);
      } catch (error) {
        console.error("تعذر التحقق من صلاحيات الحساب:", error);
        setAuthError("تعذر التحقق من صلاحيات الحساب. أعد تسجيل الدخول.");
      }
    });
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const categories = useMemo(
    () => ["الكل", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ar");
    return products.filter((product) => {
      const matchesCategory = activeCategory === "الكل" || product.category === activeCategory;
      const matchesSearch = !term || `${product.name} ${product.category}`.toLocaleLowerCase("ar").includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search]);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  function addToCart(product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      return found
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    });
    setNotice("أُضيف المنتج إلى السلة");
  }

  function updateQuantity(productId, delta) {
    setCart((current) =>
      current
        .map((item) => item.id === productId ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0),
    );
  }

  function beginOrder(items) {
    setOrderItems(items);
    setOrderStatus("");
    setCartOpen(false);
    setSelectedProduct(null);
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (!db || !orderItems?.length) {
      setOrderStatus("يلزم إعداد Firebase لإرسال الطلب. أضف إعدادات المشروع في ملف .env.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const wilaya = String(form.get("wilaya") || "");
    if (name.length < 3 || !/^(0|\+213)[0-9 ]{8,13}$/.test(phone) || !wilaya) {
      setOrderStatus("تحقق من الاسم ورقم الهاتف واختر الولاية لإكمال الطلب.");
      return;
    }
    setLoading(true);
    setOrderStatus("");
    try {
      await addDoc(collection(db, "orders"), {
        customer: { name, phone, wilaya },
        items: orderItems.map(({ id, name: productName, price, quantity }) => ({
          productId: id,
          name: productName,
          price: Number(price),
          quantity,
        })),
        total: orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
        paymentMethod: "cash_on_delivery",
        status: "new",
        createdAt: serverTimestamp(),
      });
      setOrderStatus("تم تأكيد طلبك بنجاح! سنتواصل معك هاتفياً لتأكيد التوصيل.");
      setCart([]);
      window.setTimeout(() => {
        setOrderItems(null);
        setOrderStatus("");
      }, 3200);
    } catch (error) {
      console.error("تعذر حفظ الطلب:", error);
      setOrderStatus("تعذر إرسال الطلب حالياً. حاول مرة أخرى بعد قليل.");
    } finally {
      setLoading(false);
    }
  }

  async function addProduct(event) {
    event.preventDefault();
    if (!db) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const product = {
      name: String(form.get("name")).trim(),
      description: String(form.get("description")).trim(),
      category: String(form.get("category")).trim(),
      price: Number(form.get("price")),
      image: String(form.get("image")).trim(),
      createdAt: serverTimestamp(),
    };
    if (!product.name || !product.description || !product.category || !product.image || product.price <= 0) {
      setNotice("أكمل جميع البيانات وأدخل سعراً صحيحاً");
      return;
    }
    try {
      await addDoc(collection(db, "products"), product);
      formElement.reset();
      setNotice("تمت إضافة المنتج");
    } catch (error) {
      console.error("تعذرت إضافة المنتج:", error);
      setNotice("تعذرت إضافة المنتج. تحقق من صلاحيات المشرف.");
    }
  }

  async function removeProduct(product) {
    if (!db || !window.confirm(`هل تريد حذف «${product.name}»؟`)) return;
    try {
      await deleteDoc(doc(db, "products", product.id));
      setNotice("تم حذف المنتج");
    } catch (error) {
      console.error("تعذر حذف المنتج:", error);
      setNotice("تعذر حذف المنتج. تحقق من صلاحيات المشرف.");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setAuthError("");
    const form = new FormData(event.currentTarget);
    try {
      const credential = await signInWithEmailAndPassword(auth, form.get("email"), form.get("password"));
      const token = await credential.user.getIdTokenResult(true);
      setIsAdmin(token.claims.admin === true);
      if (token.claims.admin !== true) {
        setAuthError("هذا الحساب لا يملك صلاحيات إدارة المتجر.");
        await signOut(auth);
      }
    } catch (error) {
      console.error("تعذر تسجيل دخول المشرف:", error);
      setAuthError("تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.");
    }
  }

  return (
    <main>
      <div className="announcement">
        <Sparkles size={14} />
        <span>توصيل لجميع ولايات الوطن · الدفع عند الاستلام</span>
        <span className="announcement-separator">✦</span>
        <span>تسوّق وأنت مطمئن</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="سوق - الصفحة الرئيسية">
          <span className="brand-mark"><ShoppingBag size={20} strokeWidth={2.4} /></span>
          <span>سُوق<span className="brand-dot">.</span></span>
        </a>
        <nav className="main-nav" aria-label="القائمة الرئيسية">
          <a className="nav-active" href="#products">الرئيسية</a>
          <a href="#products">اكتشف المنتجات</a>
          <a href="#about">عن المتجر</a>
        </nav>
        <div className="header-actions">
          <label className={searchOpen ? "search-box search-open" : "search-box"}>
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن منتج..." aria-label="ابحث عن منتج" />
          </label>
          <button className="icon-button mobile-search" onClick={() => setSearchOpen((open) => !open)} aria-label="بحث">
            <Search size={19} />
          </button>
          <button className="icon-button" onClick={() => setAdminOpen(true)} aria-label="لوحة التحكم">
            <CircleUserRound size={20} />
          </button>
          <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`السلة ${cartCount} منتجات`}>
            <ShoppingCart size={19} />
            <span>السلة</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> اختيارات تصنع الفرق</div>
          <h1>أشياء تحبّها،<br /><span>بسعر يفرّحك.</span></h1>
          <p>منتجات مختارة بعناية، تجربة تسوّق سهلة، وتوصيل لباب دارك وين ما كنت في الجزائر.</p>
          <a className="primary-button hero-cta" href="#products">اكتشف المنتجات <ArrowLeft size={17} /></a>
          <div className="hero-assurance">
            <span><Check size={14} /> الدفع عند الاستلام</span>
            <span><Truck size={15} /> توصيل 58 ولاية</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-image-wrap">
            <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=90" alt="تشكيلة من المنتجات العصرية" />
            <div className="hero-image-shade" />
          </div>
          <div className="hero-sticker"><span>اختيار</span><strong>مميز</strong><Sparkles size={17} /></div>
          <div className="hero-floating">
            <span className="floating-icon"><Truck size={17} /></span>
            <span><strong>لباب دارك</strong><small>توصيل وين ما كنت</small></span>
            <ArrowUpLeft size={15} />
          </div>
          <span className="hero-orbit orbit-one" />
          <span className="hero-orbit orbit-two" />
        </div>
        <div className="hero-index">01 <span /> 03</div>
      </section>

      <section className="benefits" id="about">
        <div className="benefit"><span className="benefit-icon"><Truck size={20} /></span><span><strong>توصيل لكل الجزائر</strong><small>من أدرار إلى الطارف</small></span></div>
        <div className="benefit"><span className="benefit-icon"><Check size={20} /></span><span><strong>تسوّق بكل راحة</strong><small>الدفع فقط عند الاستلام</small></span></div>
        <div className="benefit"><span className="benefit-icon"><Heart size={19} /></span><span><strong>منتجات مختارة</strong><small>الجودة أولويتنا</small></span></div>
        <div className="benefit benefit-last"><span className="benefit-icon"><CircleUserRound size={20} /></span><span><strong>نحن هنا لمساعدتك</strong><small>خدمة زبائن قريبة منك</small></span></div>
      </section>

      <section className="products-section" id="products">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> تسوّق على راحتك</div>
            <h2>لقيناها ليك<span className="brand-dot">.</span></h2>
            <p>منتجات نحبّوها، ونظن راح تحبّوها حتى نتوما.</p>
          </div>
          <a href="#products" className="view-all">عرض الكل <ArrowLeft size={16} /></a>
        </div>
        <div className="category-row">
          <div className="category-tabs" aria-label="تصنيفات المنتجات">
            {categories.map((category) => (
              <button key={category} className={activeCategory === category ? "category-tab selected" : "category-tab"} onClick={() => setActiveCategory(category)}>
                {category}
              </button>
            ))}
          </div>
          <div className="sort-label">منتجاتنا <ChevronDown size={14} /></div>
        </div>
        {productsError && <div className="inline-error" role="alert">{productsError}</div>}
        {!isFirebaseConfigured && <div className="demo-note"><Sparkles size={15} /> وضع العرض: المنتجات المعروضة أمثلة. اربط Firebase لتحميل منتجاتك واستقبال الطلبات.</div>}
        <div className="product-grid">
          {visibleProducts.map((product, index) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <button className="image-detail-hit" onClick={() => setSelectedProduct(product)} aria-label={`تفاصيل ${product.name}`}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                </button>
                {product.badge && <span className="product-badge">{product.badge}</span>}
                <button
                  className={favorites.includes(product.id) ? "favorite-button is-favorite" : "favorite-button"}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFavorites((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id]);
                  }}
                  aria-label="أضف إلى المفضلة"
                ><Heart size={17} fill={favorites.includes(product.id) ? "currentColor" : "none"} /></button>
                <button className="product-image-quick" onClick={() => addToCart(product)}>أضف للسلة <Plus size={15} /></button>
              </div>
              <div className="product-info">
                <div className="product-meta"><span>{product.category || "منتجات مختارة"}</span><span className="product-rating">★ <span>4.9</span></span></div>
                <button className="product-title" onClick={() => setSelectedProduct(product)}>{product.name}</button>
                <div className="product-bottom">
                  <div className="price-wrap"><strong>{money(product.price)} <small>د.ج</small></strong>{product.oldPrice && <del>{money(product.oldPrice)} د.ج</del>}</div>
                  <button className="round-add" onClick={() => addToCart(product)} aria-label={`أضف ${product.name} للسلة`}><Plus size={18} /></button>
                </div>
              </div>
              <span className="product-number">0{index + 1}</span>
            </article>
          ))}
        </div>
        {visibleProducts.length === 0 && <div className="empty-state">ما لقيناش منتجات بهاذ البحث. جرّب كلمة أخرى.</div>}
      </section>

      <section className="shipping-banner">
        <div className="banner-icon"><Truck size={22} /></div>
        <div><strong>الجزائر كاملة، في خدمتك.</strong><span>نوصّلو حتى لباب دارك — والدفع كي توصلك طلبّيتك.</span></div>
        <a href="#products">تسوّق الآن <ArrowLeft size={16} /></a>
        <span className="banner-decoration">58</span>
      </section>

      <footer className="site-footer">
        <a className="brand" href="#"><span className="brand-mark"><ShoppingBag size={18} /></span><span>سُوق<span className="brand-dot">.</span></span></a>
        <span>تسوّق أذكى. اختار أحسن. © {new Date().getFullYear()} سُوق</span>
        <button onClick={() => setAdminOpen(true)}>إدارة المتجر</button>
      </footer>

      {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}

      {selectedProduct && (
        <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setSelectedProduct(null)}>
          <section className="modal product-modal" role="dialog" aria-modal="true" aria-label="تفاصيل المنتج">
            <button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="إغلاق"><X size={19} /></button>
            <img className="detail-image" src={selectedProduct.image} alt={selectedProduct.name} />
            <div className="detail-copy">
              <span className="detail-category">{selectedProduct.category || "منتجات مختارة"}</span>
              <h3>{selectedProduct.name}</h3>
              <p>{selectedProduct.description}</p>
              <strong className="detail-price">{money(selectedProduct.price)} <small>د.ج</small></strong>
              <div className="detail-assurance"><Truck size={16} /> التوصيل متوفر في جميع الولايات · الدفع عند الاستلام</div>
              <div className="detail-actions">
                <button className="primary-button" onClick={() => beginOrder([{ ...selectedProduct, quantity: 1 }])}>اشترِ الآن <ArrowLeft size={16} /></button>
                <button className="secondary-button" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>أضف للسلة <ShoppingCart size={16} /></button>
              </div>
            </div>
          </section>
        </div>
      )}

      {cartOpen && (
        <div className="overlay drawer-overlay" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="سلة التسوق">
            <div className="drawer-heading"><div><span className="eyebrow">تسوّقك</span><h3>سلة المشتريات <span>({cartCount})</span></h3></div><button className="modal-close" onClick={() => setCartOpen(false)} aria-label="إغلاق"><X size={19} /></button></div>
            {cart.length ? <>
              <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}>
                <img src={item.image} alt="" />
                <div className="cart-item-copy"><strong>{item.name}</strong><span>{money(item.price)} د.ج</span><div className="quantity-control"><button onClick={() => updateQuantity(item.id, -1)} aria-label="إنقاص الكمية"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} aria-label="زيادة الكمية"><Plus size={13} /></button></div></div>
                <button className="remove-item" onClick={() => setCart((items) => items.filter((entry) => entry.id !== item.id))} aria-label="حذف من السلة"><Trash2 size={16} /></button>
              </div>)}</div>
              <div className="drawer-total"><span>المجموع</span><strong>{money(cartTotal)} <small>د.ج</small></strong></div>
              <button className="primary-button checkout-button" onClick={() => beginOrder(cart)}>إتمام الطلب <ArrowLeft size={17} /></button>
              <p className="drawer-hint"><Truck size={14} /> الدفع عند الاستلام، التوصيل لكل الولايات</p>
            </> : <div className="empty-cart"><span><ShoppingCart size={25} /></span><strong>السلة تاعك مازال فارغة</strong><p>تصفّح منتجاتنا واختار لي يعجبك.</p><button className="secondary-button" onClick={() => setCartOpen(false)}>تابع التسوّق</button></div>}
          </aside>
        </div>
      )}

      {orderItems && (
        <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setOrderItems(null)}>
          <section className="modal order-modal" role="dialog" aria-modal="true" aria-label="إتمام الطلب">
            <button className="modal-close" onClick={() => setOrderItems(null)} aria-label="إغلاق"><X size={19} /></button>
            <div className="eyebrow"><span className="eyebrow-line" /> خطوة أخيرة</div>
            <h3>وين نبعثولك الطلب؟</h3>
            <p className="order-subtitle">دخل معلوماتك، ونتصلو بيك باش نأكدو الطلب.</p>
            <div className="order-summary">{orderItems.map((item) => <div key={item.id}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)} د.ج</strong></div>)}<div className="summary-total"><span>المجموع</span><strong>{money(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0))} د.ج</strong></div></div>
            <form className="order-form" onSubmit={submitOrder}>
              <label>الاسم الكامل<input name="name" placeholder="مثال: محمد أمين" autoComplete="name" required minLength={3} /></label>
              <label>رقم الهاتف<input name="phone" type="tel" placeholder="05 / 06 / 07 xx xx xx xx" autoComplete="tel" required /></label>
              <label>الولاية<select name="wilaya" defaultValue="" required><option value="" disabled>اختار ولايتك</option>{wilayas.map((name, index) => <option key={name} value={`${String(index + 1).padStart(2, "0")} - ${name}`}>{String(index + 1).padStart(2, "0")} - {name}</option>)}</select></label>
              <div className="payment-option"><span className="payment-check"><Check size={14} /></span><span><strong>الدفع عند الاستلام</strong><small>تخلّص كي توصلك السلعة</small></span><span className="cod-tag">COD</span></div>
              {orderStatus && <div className={orderStatus.startsWith("تم") ? "form-status success" : "form-status"} role="status">{orderStatus}</div>}
              <button className="primary-button checkout-button" type="submit" disabled={loading}>{loading ? "جارٍ إرسال الطلب..." : "أكد الطلب"} {!loading && <ArrowLeft size={17} />}</button>
            </form>
          </section>
        </div>
      )}

      {adminOpen && (
        <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setAdminOpen(false)}>
          <section className="modal admin-modal" role="dialog" aria-modal="true" aria-label="لوحة إدارة المتجر">
            <button className="modal-close" onClick={() => setAdminOpen(false)} aria-label="إغلاق"><X size={19} /></button>
            <div className="admin-title"><span className="admin-icon"><Menu size={19} /></span><div><span className="eyebrow">مساحة خاصة</span><h3>إدارة المتجر</h3></div></div>
            {!isFirebaseConfigured ? <div className="admin-empty"><p>أضف إعدادات Firebase في ملف <code>.env</code> لتفعيل لوحة الإدارة.</p></div>
              : !user || !isAdmin ? <form className="order-form login-form" onSubmit={handleLogin}>
                <p>سجّل الدخول بحساب المشرف للوصول إلى إدارة المنتجات.</p>
                <label>البريد الإلكتروني<input type="email" name="email" placeholder="admin@example.com" required /></label>
                <label>كلمة المرور<input type="password" name="password" required /></label>
                {authError && <div className="form-status" role="alert">{authError}</div>}
                <button className="primary-button checkout-button">دخول آمن <ArrowLeft size={17} /></button>
              </form>
              : <div className="admin-content">
                <div className="admin-toolbar"><span>مرحباً، {user.email}</span><button className="text-button" onClick={() => signOut(auth)}>تسجيل الخروج</button></div>
                <form className="product-form" onSubmit={addProduct}>
                  <h4>إضافة منتج جديد</h4>
                  <label>اسم المنتج<input name="name" placeholder="اسم المنتج" required /></label>
                  <div className="form-two-col">
                    <label>السعر (د.ج)<input type="number" name="price" min="1" placeholder="4500" required /></label>
                    <label>التصنيف<input name="category" placeholder="إلكترونيات" required /></label>
                  </div>
                  <label>الوصف<textarea name="description" rows="3" placeholder="وصف مختصر للمنتج" required /></label>
                  <label>رابط الصورة<input type="url" name="image" placeholder="https://..." required /></label>
                  <button className="primary-button checkout-button">أضف المنتج <Plus size={17} /></button>
                </form>
                <h4 className="inventory-heading">المنتجات الحالية <span>{products.length}</span></h4>
                <div className="inventory-list">{products.map((product) => <div className="inventory-item" key={product.id}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{money(product.price)} د.ج</small></span><button className="remove-item" onClick={() => removeProduct(product)} aria-label={`حذف ${product.name}`}><Trash2 size={16} /></button></div>)}</div>
              </div>}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
