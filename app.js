const STORE = {
  whatsappNumber: "919663398061",
  upiId: "9663398061@upi",
  payeeName: "Praveen Vanahalli",
  orderDatabaseUrl: "",
  googleFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLScnPv-PYpPH14vQvmkQtEkG_9HDSE12LPe1GS43EKkA8p7_kQ/formResponse",
  googleFormEntries: {
    orderId: "entry.1837942117",
    customerName: "entry.444893747",
    phone: "entry.1529726925",
    deliverySlot: "entry.2128148307",
    items: "entry.390305662",
    subtotal: "entry.1994514591",
    deliveryFee: "entry.2058519695",
    total: "entry.957887164",
    upiId: "entry.2030549416",
    paymentStatus: "entry.1431575225",
    orderStatus: "entry.515044861",
    notes: "entry.1574196271",
  },
  freeDeliveryAt: 799,
  deliveryFees: {
    "Local Bengaluru": 49,
    "Outer Bengaluru": 79,
    Pickup: 0,
  },
};

const products = [
  {
    id: "sunflower",
    name: "Sunflower Shoots",
    variants: [
      { id: "sunflower-25g", unit: "25g box", price: 60 },
      { id: "sunflower-50g", unit: "50g box", price: 120 },
    ],
    description: "Crunchy, nutty greens for sandwiches, salads, wraps, and stir-ins.",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sunflower_microgreens_01.jpg?width=900",
  },
  {
    id: "radish",
    name: "Radish Microgreens",
    variants: [
      { id: "radish-25g", unit: "25g box", price: 60 },
      { id: "radish-50g", unit: "50g box", price: 120 },
    ],
    description: "Peppery bite for chaats, soups, egg dishes, and restaurant plating.",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/%D0%9C%D0%B8%D0%BA%D1%80%D0%BE%D0%B7%D0%B5%D0%BB%D0%B5%D0%BD%D1%8C%20%D1%80%D0%B5%D0%B4%D1%8C%D0%BA%D0%B8%20%D0%94%D0%B0%D0%B9%D0%BA%D0%BE%D0%BD.jpg?width=900",
  },
  {
    id: "broccoli",
    name: "Broccoli Microgreens",
    variants: [
      { id: "broccoli-25g", unit: "25g box", price: 85 },
      { id: "broccoli-50g", unit: "50g box", price: 170 },
    ],
    description: "Mild, clean flavour with wellness appeal for bowls and smoothies.",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Broccoli_sprouts.jpg?width=900",
  },
  {
    id: "mustard",
    name: "Mustard Microgreens",
    variants: [
      { id: "mustard-25g", unit: "25g box", price: 60 },
      { id: "mustard-50g", unit: "50g box", price: 120 },
    ],
    description: "Sharp and aromatic greens for Indian meals, dips, and garnishes.",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mizuna_microgreen.jpg?width=900",
  },
];

const planProducts = {
  "Starter Box": { id: "plan-starter", name: "Starter Box", price: 399, unit: "3 packs weekly" },
  "Family Box": { id: "plan-family", name: "Family Box", price: 749, unit: "6 packs weekly" },
  "Chef Box": { id: "plan-chef", name: "Chef Box", price: 1399, unit: "12 packs weekly" },
};

const cart = new Map(JSON.parse(localStorage.getItem("chiguru-cart") || "[]"));

const formatRupees = (value) => `₹${value.toLocaleString("en-IN")}`;

function saveCart() {
  localStorage.setItem("chiguru-cart", JSON.stringify([...cart.entries()]));
}

function getProduct(id) {
  for (const product of products) {
    const variant = product.variants.find((item) => item.id === id);
    if (variant) {
      return {
        ...variant,
        name: product.name,
      };
    }
  }

  return Object.values(planProducts).find((plan) => plan.id === id);
}

function removeUnavailableCartItems() {
  let changed = false;

  for (const id of cart.keys()) {
    if (!getProduct(id)) {
      cart.delete(id);
      changed = true;
    }
  }

  if (changed) saveCart();
}

function getSubtotal() {
  return [...cart.entries()].reduce((sum, [id, qty]) => {
    const product = getProduct(id);
    return product ? sum + product.price * qty : sum;
  }, 0);
}

function getDeliveryFee() {
  const area = document.querySelector("[name='area']")?.value || "Local Bengaluru";
  const subtotal = getSubtotal();
  if (subtotal === 0 || subtotal >= STORE.freeDeliveryAt) return 0;
  return STORE.deliveryFees[area] ?? STORE.deliveryFees["Local Bengaluru"];
}

function addToCart(id) {
  if (!getProduct(id)) return;
  cart.set(id, (cart.get(id) || 0) + 1);
  saveCart();
  renderCart();
}

function updateQuantity(id, delta) {
  const nextQty = (cart.get(id) || 0) + delta;
  if (!getProduct(id)) {
    cart.delete(id);
    saveCart();
    renderCart();
    return;
  }

  if (nextQty <= 0) {
    cart.delete(id);
  } else {
    cart.set(id, nextQty);
  }
  saveCart();
  renderCart();
}

function renderProducts() {
  const grid = document.querySelector("[data-product-grid]");
  grid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
          <div class="product-body">
            <div class="product-meta">
              <strong>${product.name}</strong>
              <b>From ${formatRupees(Math.min(...product.variants.map((variant) => variant.price)))}</b>
            </div>
            <p>${product.description}</p>
            <div class="variant-actions">
              ${product.variants
                .map(
                  (variant) => `
                    <button type="button" data-add="${variant.id}">
                      <span>${variant.unit}</span>
                      <strong>${formatRupees(variant.price)}</strong>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderCart() {
  const cartItems = document.querySelector("[data-cart-items]");
  const subtotal = getSubtotal();
  const delivery = getDeliveryFee();
  const total = subtotal + delivery;
  const itemCount = [...cart.values()].reduce((sum, qty) => sum + qty, 0);

  document.querySelector("[data-cart-count]").textContent = itemCount;
  document.querySelector("[data-subtotal]").textContent = formatRupees(subtotal);
  document.querySelector("[data-delivery]").textContent = delivery === 0 ? "Free" : formatRupees(delivery);
  document.querySelector("[data-total]").textContent = formatRupees(total);

  if (cart.size === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Your cart is empty. Add a fresh pack to begin.</p>`;
  } else {
    cartItems.innerHTML = [...cart.entries()]
      .filter(([id]) => getProduct(id))
      .map(([id, qty]) => {
        const product = getProduct(id);
        return `
          <div class="cart-item">
            <div>
              <strong>${product.name}</strong>
              <span>${product.unit} · ${formatRupees(product.price)} each</span>
            </div>
            <div class="qty-controls" aria-label="Quantity controls for ${product.name}">
              <button type="button" data-qty="${id}" data-delta="-1">−</button>
              <strong>${qty}</strong>
              <button type="button" data-qty="${id}" data-delta="1">+</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  updateUpiLink(total);
}

function updateUpiLink(total) {
  const upiLink = document.querySelector("[data-upi-link]");
  const upiId = document.querySelector("[data-upi-id]");
  const paymentAmount = document.querySelector("[data-payment-amount]");
  const amount = Math.max(total, 0);
  const params = new URLSearchParams({
    pa: STORE.upiId,
    pn: STORE.payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: "Chiguru Microgreens order",
  });
  upiLink.dataset.upiUrl = `upi://pay?${params.toString()}`;
  upiId.textContent = STORE.upiId;
  paymentAmount.textContent = formatRupees(amount);
}

function getCartLines() {
  return [...cart.entries()]
    .filter(([id]) => getProduct(id))
    .map(([id, qty]) => {
      const product = getProduct(id);
      return {
        id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity: qty,
        lineTotal: product.price * qty,
      };
    });
}

function buildOrderData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const subtotal = getSubtotal();
  const delivery = getDeliveryFee();
  const total = subtotal + delivery;
  const items = getCartLines();
  const orderId = `CMG-${Date.now().toString(36).toUpperCase()}`;

  return {
    orderId,
    createdAt: new Date().toISOString(),
    customerName: data.name,
    phone: data.phone,
    address: data.address,
    area: data.area,
    slot: data.slot,
    notes: data.notes || "",
    items,
    subtotal,
    delivery,
    total,
    upiId: STORE.upiId,
    paymentStatus: "Payment Pending",
    orderStatus: "New",
  };
}

function buildOrderMessage(order) {
  const lines = order.items.map(
    (item) =>
      `- ${item.name} (${item.unit}) x ${item.quantity}: ${formatRupees(item.lineTotal)}`,
  );

  return [
    "New Chiguru Microgreens order",
    `Order ID: ${order.orderId}`,
    "",
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    `Area: ${order.area}`,
    `Slot: ${order.slot}`,
    order.notes ? `Notes: ${order.notes}` : "",
    "",
    "Items:",
    ...lines,
    "",
    `Subtotal: ${formatRupees(order.subtotal)}`,
    `Delivery: ${order.delivery === 0 ? "Free" : formatRupees(order.delivery)}`,
    `Total: ${formatRupees(order.total)}`,
    `Payment Status: ${order.paymentStatus}`,
    `Order Status: ${order.orderStatus}`,
    "",
    `UPI ID: ${STORE.upiId}`,
    "Payment screenshot will be shared here.",
  ]
    .filter(Boolean)
    .join("\n");
}

function saveOrderToDatabase(order) {
  if (!STORE.orderDatabaseUrl) {
    return saveOrderToGoogleForm(order);
  }

  return fetch(STORE.orderDatabaseUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(order),
  });
}

function saveOrderToGoogleForm(order) {
  if (!STORE.googleFormUrl) {
    return Promise.resolve({ skipped: true });
  }

  const entries = STORE.googleFormEntries;
  const formData = new FormData();
  const itemsText = order.items
    .map(
      (item) =>
        `${item.name} (${item.unit}) x ${item.quantity} = ${formatRupees(item.lineTotal)}`,
    )
    .join("\n");
  const notesText = [
    order.notes,
    `Address: ${order.address}`,
    `Area: ${order.area}`,
    `Created: ${order.createdAt}`,
  ]
    .filter(Boolean)
    .join("\n");

  formData.append(entries.orderId, order.orderId);
  formData.append(entries.customerName, order.customerName);
  formData.append(entries.phone, order.phone);
  formData.append(entries.deliverySlot, order.slot);
  formData.append(entries.items, itemsText);
  formData.append(entries.subtotal, order.subtotal);
  formData.append(entries.deliveryFee, order.delivery);
  formData.append(entries.total, order.total);
  formData.append(entries.upiId, order.upiId);
  formData.append(entries.paymentStatus, order.paymentStatus);
  formData.append(entries.orderStatus, order.orderStatus);
  formData.append(entries.notes, notesText);

  return fetch(STORE.googleFormUrl, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  });
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const qtyButton = event.target.closest("[data-qty]");
  const planButton = event.target.closest("[data-plan]");
  const upiButton = event.target.closest("[data-upi-link]");
  const copyUpiButton = event.target.closest("[data-copy-upi]");

  if (addButton) addToCart(addButton.dataset.add);

  if (qtyButton) {
    updateQuantity(qtyButton.dataset.qty, Number(qtyButton.dataset.delta));
  }

  if (planButton) {
    addToCart(planProducts[planButton.dataset.plan].id);
    document.querySelector("#checkout").scrollIntoView({ behavior: "smooth" });
  }

  if (event.target.closest("[data-clear-cart]")) {
    cart.clear();
    saveCart();
    renderCart();
  }

  if (event.target.closest("[data-scroll-cart]")) {
    document.querySelector("#checkout").scrollIntoView({ behavior: "smooth" });
  }

  if (upiButton) {
    const message = document.querySelector("[data-form-message]");
    if (getSubtotal() === 0) {
      message.textContent = "Please add items before opening UPI payment.";
      return;
    }

    message.textContent = "Opening your UPI app. On desktop, copy the UPI ID instead.";
    window.location.href = upiButton.dataset.upiUrl;
  }

  if (copyUpiButton) {
    const message = document.querySelector("[data-form-message]");
    navigator.clipboard
      .writeText(STORE.upiId)
      .then(() => {
        message.textContent = `Copied UPI ID: ${STORE.upiId}`;
      })
      .catch(() => {
        message.textContent = `UPI ID: ${STORE.upiId}`;
      });
  }
});

document.querySelector("[name='area']").addEventListener("change", renderCart);

document.querySelector("[data-checkout-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.querySelector("[data-form-message]");
  const submitButton = event.currentTarget.querySelector("button[type='submit']");

  if (cart.size === 0) {
    message.textContent = "Please add at least one item before placing the order.";
    return;
  }

  const order = buildOrderData(event.currentTarget);
  const orderText = buildOrderMessage(order);
  const whatsappUrl = `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(orderText)}`;

  submitButton.disabled = true;
  message.textContent = STORE.orderDatabaseUrl || STORE.googleFormUrl
    ? "Saving order and opening WhatsApp."
    : "Opening WhatsApp with your order summary.";

  try {
    await saveOrderToDatabase({ ...order, whatsappMessage: orderText });
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    message.textContent = `Order ${order.orderId} is ready in WhatsApp.`;
  } catch (error) {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    message.textContent =
      "WhatsApp opened, but the order database could not be reached. Please send the order message.";
  } finally {
    submitButton.disabled = false;
  }
});

removeUnavailableCartItems();
renderProducts();
renderCart();
