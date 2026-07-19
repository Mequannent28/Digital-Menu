/**
 * localStore.js
 * Simple JSON-file-backed store used as fallback when SQL Server is unavailable.
 * All data is persisted to data.json in the backend folder.
 */
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, 'data.json')

function load() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch (_) {}
  return { orders: [], orderItems: [], nextOrderId: 1 }
}

function save(data) {
  try { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)) } catch (_) {}
}

// ── Orders ────────────────────────────────────────────
function createOrder({ orderRef, tableNumber, customerName, phone, notes, subtotal, vat, serviceCharge, grandTotal, estimatedTime }) {
  const data = load()
  const order = {
    id: data.nextOrderId++,
    order_ref: orderRef,
    table_number: tableNumber || '',
    customer_name: customerName || '',
    phone: phone || '',
    notes: notes || '',
    status: 'new',
    subtotal: parseFloat(subtotal) || 0,
    vat: parseFloat(vat) || 0,
    service_charge: parseFloat(serviceCharge) || 0,
    grand_total: parseFloat(grandTotal) || 0,
    estimated_time: parseInt(estimatedTime) || 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  data.orders.unshift(order)
  save(data)
  return order
}

function addOrderItem({ orderId, name, price, qty, modifiers, specialInstructions }) {
  const data = load()
  const item = {
    id: Date.now() + Math.random(),
    order_id: orderId,
    menu_item_name: name || '',
    price: parseFloat(price) || 0,
    quantity: parseInt(qty) || 1,
    modifiers: modifiers || '',
    special_instructions: specialInstructions || '',
    item_total: (parseFloat(price) || 0) * (parseInt(qty) || 1),
  }
  data.orderItems.push(item)
  save(data)
  return item
}

function getOrders(statusFilter) {
  const data = load()
  let orders = data.orders
  if (statusFilter) orders = orders.filter(o => o.status === statusFilter)
  return orders.map(o => ({
    ...o,
    items: data.orderItems.filter(i => i.order_id === o.id),
  }))
}

function getOrderById(id) {
  const data = load()
  const order = data.orders.find(o => o.id === id || o.order_ref === String(id))
  if (!order) return null
  return { ...order, items: data.orderItems.filter(i => i.order_id === order.id) }
}

function updateOrderStatus(id, status) {
  const data = load()
  const order = data.orders.find(o => o.id === id)
  if (order) {
    order.status = status
    order.updated_at = new Date().toISOString()
    save(data)
    return order
  }
  return null
}

function deleteOrder(id) {
  const data = load()
  data.orders = data.orders.filter(o => o.id !== id)
  data.orderItems = data.orderItems.filter(i => i.order_id !== id)
  save(data)
}

module.exports = { createOrder, addOrderItem, getOrders, getOrderById, updateOrderStatus, deleteOrder }
