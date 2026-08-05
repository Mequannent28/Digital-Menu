const router = require('express').Router()
const auth   = require('../middleware/auth')
const { sql, query } = require('../db')

// ── In-memory session store ──────────────────────────────────────────────────
// { sessionId: { id, tableNumber, messages: [{role,text,ts}], createdAt, unread } }
const sessions = new Map()

function getOrCreate(sessionId, tableNumber = '') {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      tableNumber,
      messages: [],
      createdAt: new Date().toISOString(),
      unread: 0,
    })
  }
  return sessions.get(sessionId)
}

// ── Smart AI engine ──────────────────────────────────────────────────────────
async function getAIReply(userText, sessionId, tableNumber) {
  const text = userText.toLowerCase().trim()
  let menuItems = []
  let restaurantData = {}

  // Load fresh data from DB for accurate responses
  try {
    const [menuRes, restRes] = await Promise.all([
      query(`SELECT TOP 20 name, price, description, category_id, is_available, is_popular, is_spicy, is_vegetarian FROM menu_items WHERE is_available=1 ORDER BY is_popular DESC, name`),
      query(`SELECT TOP 1 name, address, phone, working_hours, wifi_password, vat_rate, service_charge_rate FROM restaurant`),
    ])
    menuItems      = menuRes.recordset  || []
    restaurantData = restRes.recordset[0] || {}
  } catch (_) {}

  const restaurant = restaurantData.name || 'ABC Restaurant'
  const vatPct     = Math.round((restaurantData.vat_rate || 0.15) * 100)
  const svcPct     = Math.round((restaurantData.service_charge_rate || 0.10) * 100)

  // ── Intent matching ─────────────────────────────────────────────────────────

  // Greetings
  if (/^(hi|hello|hey|hiya|good (morning|afternoon|evening)|selam|salam|ye|ሰላም)/i.test(text)) {
    const greets = [
      `👋 Hello! Welcome to **${restaurant}**! I'm your virtual assistant.\n\nI can help you with:\n• 🍽️ Browse our menu\n• 💰 Prices & specials\n• 📍 Location & hours\n• 📦 Track your order\n• ❓ Any questions\n\nWhat can I get for you today?`,
      `🍽️ Hi there! Welcome to **${restaurant}**! How can I help you today?\n\nAsk me about our menu, prices, hours, or anything else!`,
    ]
    return greets[Math.floor(Math.random() * greets.length)]
  }

  // Menu request
  if (/menu|food|eat|order|item|dish|meal|what.*have|what.*serve|show me/i.test(text)) {
    if (menuItems.length === 0) {
      return `🍽️ Our menu is loading... Please check the menu tab for the full list of delicious items!`
    }
    const topItems = menuItems.slice(0, 8)
    const lines = topItems.map(i => {
      const tags = [i.is_spicy ? '🌶️' : '', i.is_vegetarian ? '🥬' : '', i.is_popular ? '🔥' : ''].filter(Boolean).join(' ')
      return `• **${i.name}** — ${i.price} ETB ${tags}`
    }).join('\n')
    return `🍽️ Here are some of our popular items:\n\n${lines}\n\n👆 Tap **Browse Menu** to see the full menu with images and details!`
  }

  // Price query
  if (/price|cost|how much|birr|etb|expensive|cheap/i.test(text)) {
    if (menuItems.length > 0) {
      const sorted  = [...menuItems].sort((a,b) => a.price - b.price)
      const cheapest = sorted[0]
      const priciest = sorted[sorted.length - 1]
      return `💰 Our prices range from **${cheapest.price} ETB** (${cheapest.name}) to **${priciest.price} ETB** (${priciest.name}).\n\n📋 All prices include:\n• VAT: ${vatPct}%\n• Service charge: ${svcPct}%\n\nWould you like to know the price of a specific item?`
    }
    return `💰 Our prices are very reasonable! Please check the menu for detailed pricing. All prices are in ETB and include ${vatPct}% VAT.`
  }

  // Specific item price — "how much is pizza" etc.
  if (menuItems.length > 0) {
    const matched = menuItems.find(i =>
      text.includes(i.name.toLowerCase()) ||
      i.name.toLowerCase().split(' ').some(word => word.length > 3 && text.includes(word))
    )
    if (matched) {
      const tags = []
      if (matched.is_spicy) tags.push('🌶️ Spicy')
      if (matched.is_vegetarian) tags.push('🥬 Vegetarian')
      if (matched.is_popular) tags.push('🔥 Popular')
      return `✨ **${matched.name}**\n\n💰 Price: **${matched.price} ETB**\n${tags.length ? tags.join(' · ') + '\n' : ''}${matched.description ? `\n📝 ${matched.description.slice(0, 120)}` : ''}\n\nWould you like to add this to your cart? 🛒`
    }
  }

  // Opening hours / hours
  if (/hour|open|close|time|when|schedule|working/i.test(text)) {
    return `🕐 **Working Hours**\n\n${restaurantData.working_hours || 'Mon–Sun: 7:00 AM – 11:00 PM'}\n\nWe're open every day! Come visit us anytime within our working hours. 😊`
  }

  // Location / address
  if (/where|location|address|direction|map|find you|how.*get/i.test(text)) {
    return `📍 **Our Location**\n\n${restaurantData.address || 'Bole Road, Addis Ababa, Ethiopia'}\n\n📞 Phone: ${restaurantData.phone || '+251 91 859 2028'}\n\nYou can find us on Google Maps — just search "${restaurant}"!`
  }

  // WiFi
  if (/wifi|wi-fi|internet|password|network/i.test(text)) {
    return `📶 **WiFi Access**\n\nNetwork: **${restaurant}_Guest**\nPassword: **${restaurantData.wifi_password || 'Ask your waiter'}**\n\nEnjoy browsing while you dine! 🌐`
  }

  // Phone / contact
  if (/phone|call|contact|number|reach/i.test(text)) {
    return `📞 **Contact Us**\n\nPhone: **${restaurantData.phone || '+251 91 859 2028'}**\nAddress: ${restaurantData.address || 'Bole Road, Addis Ababa'}\n\nFeel free to call us for reservations or any inquiries!`
  }

  // Order tracking
  if (/track|order|status|where.*food|ready|delivered|how long/i.test(text)) {
    return `📦 **Order Tracking**\n\nYou can track your order in real-time!\n\n1️⃣ Go to **My Orders** in the app\n2️⃣ Find your order reference number\n3️⃣ See live status: Received → Preparing → Ready → Served\n\n⏱️ Average prep time: 15–25 minutes\n\nNeed help with a specific order? Tell me your order number!`
  }

  // Reservation
  if (/reserv|book|table|seat/i.test(text)) {
    return `🪑 **Table Reservations**\n\nYou can:\n• Walk in anytime — we welcome all guests!\n• Call us: **${restaurantData.phone || '+251 91 859 2028'}**\n• Scan the QR code at any table to start ordering directly\n\nWe'd love to have you! 😊`
  }

  // Spicy / vegetarian
  if (/spicy|spice|hot|veg|vegetarian|halal|allerg/i.test(text)) {
    const spicy = menuItems.filter(i => i.is_spicy).slice(0, 4).map(i => i.name).join(', ')
    const veg   = menuItems.filter(i => i.is_vegetarian).slice(0, 4).map(i => i.name).join(', ')
    return `🌶️ **Dietary Information**\n\n**Spicy dishes:** ${spicy || 'Ask our staff for spicy options'}\n\n🥬 **Vegetarian dishes:** ${veg || 'We have several vegetarian options — ask your waiter!'}\n\nAll our food is prepared with care. Please inform your waiter of any specific dietary requirements!`
  }

  // Complaint / problem
  if (/complaint|problem|issue|wrong|bad|unhappy|not good|terrible|awful/i.test(text)) {
    return `😔 We're really sorry to hear that!\n\nYour experience matters to us deeply. I'm connecting you with our staff right now.\n\n👨‍💼 **A manager will be with you shortly.**\n\nYou can also:\n• 📞 Call us: ${restaurantData.phone || '+251 91 859 2028'}\n• ⭐ Leave a review to help us improve\n\nThank you for your patience — we'll make it right! 🙏`
  }

  // Compliment / thanks
  if (/thank|great|awesome|love|delicious|amazing|wonderful|excellent|best/i.test(text)) {
    return `😊 Thank you so much! That means the world to us!\n\nWe work hard every day to give you the best experience. 🙏\n\n⭐ Would you like to leave us a review? It really helps us!\n\nIs there anything else I can help you with?`
  }

  // Waiter / help
  if (/waiter|staff|help|assist|someone|human|person|agent|talk to/i.test(text)) {
    return `🛎️ **Calling a Waiter**\n\nI'm notifying our staff right now!\n\nYou can also:\n• Tap the **🔔 bell icon** at the top of the menu page\n• A waiter will be with you within a few minutes\n\nIn the meantime, is there anything I can help you with? 😊`
  }

  // Bill / payment
  if (/bill|pay|payment|cash|card|checkout/i.test(text)) {
    return `💳 **Payment Information**\n\nWe currently accept:\n• 💵 Cash payment at the table\n• Your waiter will bring the bill when you're ready\n\n📋 To request your bill:\n• Tap the **🔔 bell** → select "Request the bill"\n• Or tell your waiter directly\n\nAll prices include ${vatPct}% VAT and ${svcPct}% service charge.`
  }

  // Goodbye
  if (/bye|goodbye|see you|later|thanks bye|cya/i.test(text)) {
    return `👋 Goodbye! Thank you for visiting **${restaurant}**!\n\nWe hope to see you again very soon. Have a wonderful day! 🌟\n\n⭐ Don't forget to leave us a review!`
  }

  // Default — escalate to human
  return `🤔 I'm not quite sure about that, but I want to make sure you get the right answer!\n\n💬 **I'm connecting you with our team** — a staff member will reply to you shortly.\n\nIn the meantime, you can also:\n• 🍽️ Browse our menu\n• 🔔 Call a waiter\n• 📞 Call us: ${restaurantData.phone || '+251 91 859 2028'}\n\nIs there anything specific I can help you with right now?`
}

// ── POST /api/chat  (customer sends message) ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { sessionId, tableNumber, message, customerName } = req.body
    if (!sessionId || !message?.trim()) return res.status(400).json({ error: 'sessionId and message required' })

    const session = getOrCreate(sessionId, tableNumber || '')
    if (customerName && !session.customerName) session.customerName = customerName
    if (tableNumber  && !session.tableNumber)  session.tableNumber  = tableNumber

    // Save customer message
    const customerMsg = { role: 'customer', text: message.trim(), ts: new Date().toISOString(), id: `${Date.now()}-c` }
    session.messages.push(customerMsg)
    session.unread++
    session.lastActivity = new Date().toISOString()

    // Get AI reply
    const aiText  = await getAIReply(message, sessionId, tableNumber)
    const botMsg  = { role: 'bot', text: aiText, ts: new Date().toISOString(), id: `${Date.now()}-b` }
    session.messages.push(botMsg)

    // Notify admin via socket
    const io = req.app.get('io')
    if (io) {
      io.emit('chat_new_message', {
        sessionId,
        tableNumber:  session.tableNumber,
        customerName: session.customerName || '',
        message:      customerMsg,
        unread:       session.unread,
      })
    }

    res.json({ message: botMsg, sessionId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/chat/:sessionId/reply  (admin replies) ─────────────────────────
router.post('/:sessionId/reply', auth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { message } = req.body
    const adminUser = req.user

    if (!sessions.has(sessionId)) return res.status(404).json({ error: 'Session not found' })
    const session = sessions.get(sessionId)

    const adminMsg = {
      role: 'admin',
      text: message.trim(),
      ts: new Date().toISOString(),
      id: `${Date.now()}-a`,
      adminName: adminUser?.name || 'Staff',
    }
    session.messages.push(adminMsg)
    session.lastActivity = new Date().toISOString()

    // Push to customer's socket room
    const io = req.app.get('io')
    if (io) {
      io.emit(`chat_admin_reply_${sessionId}`, adminMsg)
      io.emit('chat_admin_reply', { sessionId, message: adminMsg })
    }

    res.json({ message: adminMsg })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/chat/sessions  (admin sees all conversations) ───────────────────
router.get('/sessions', auth, (req, res) => {
  const list = Array.from(sessions.values())
    .sort((a, b) => new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt))
  res.json(list)
})

// ── GET /api/chat/:sessionId  (admin reads one conversation) ─────────────────
router.get('/:sessionId', auth, (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).json({ error: 'Not found' })
  session.unread = 0   // mark as read
  res.json(session)
})

// ── DELETE /api/chat/:sessionId  (admin clears) ──────────────────────────────
router.delete('/:sessionId', auth, (req, res) => {
  sessions.delete(req.params.sessionId)
  res.status(204).end()
})

module.exports = router
