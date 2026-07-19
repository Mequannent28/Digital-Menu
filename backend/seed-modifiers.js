// Seed modifier groups and modifiers into the database
const BASE = 'http://localhost:8000/api'

const modifierGroups = [
  {
    name: 'Choose Size', name_am: 'መጠን ይምረጡ',
    required: false, multi_select: false, max_select: 1,
    modifiers: [
      { name: 'Regular', name_am: 'መደበኛ', price: 0 },
      { name: 'Large', name_am: 'ትልቅ', price: 150 },
    ],
  },
  {
    name: 'Extra Sauce', name_am: 'ተጨማሪ ሶስ',
    required: false, multi_select: true, max_select: 3,
    modifiers: [
      { name: 'Ketchup',        name_am: 'ኬቸፕ',         price: 65 },
      { name: 'BBQ Sauce',      name_am: 'ባርቤኪው ሶስ',   price: 109 },
      { name: 'Mayo',           name_am: 'ማዮ',          price: 130 },
      { name: 'Spicy Mayo',     name_am: 'ስፓይሲ ማዮ',   price: 130 },
      { name: 'Buffalo Sauce',  name_am: 'ቡፋሎ ሶስ',    price: 196 },
      { name: 'Peri Peri Sauce',name_am: 'ፔሪ ፔሪ ሶስ',  price: 196 },
      { name: 'Garlic Mayo',    name_am: 'ጃርሊክ ማዮ',   price: 152 },
      { name: 'Green Chilli Sauce', name_am: 'አረንጓዴ ቺሊ', price: 87 },
    ],
  },
  {
    name: 'Add Extras', name_am: 'ተጨማሪ ጨምር',
    required: false, multi_select: true, max_select: 5,
    modifiers: [
      { name: 'Extra Cheese',  name_am: 'ተጨማሪ ቺዝ',   price: 252 },
      { name: 'Bacon',         name_am: 'ቤኮን',         price: 174 },
      { name: 'Egg',           name_am: 'እንቁላል',        price: 78 },
      { name: 'Avocado',       name_am: 'አቮካዶ',        price: 170 },
      { name: 'Mushrooms',     name_am: 'ፈንገስ',        price: 96 },
      { name: 'Jalapeño',      name_am: 'ጃላፔኖ',        price: 96 },
      { name: 'Pickles',       name_am: 'ፒክልስ',        price: 96 },
      { name: 'French Fries',  name_am: 'ፈረንሳይ ድንች',  price: 261 },
    ],
  },
  {
    name: 'Add a Drink', name_am: 'መጠጥ ጨምር',
    required: false, multi_select: false, max_select: 1,
    modifiers: [
      { name: 'Water',      name_am: 'ውሃ',     price: 87 },
      { name: 'Soft Drink', name_am: 'ለስላሳ',   price: 130 },
      { name: 'Tea',        name_am: 'ሻይ',     price: 57 },
    ],
  },
]

async function main() {
  // 1. Login to get token
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@abc.com', password: 'admin123' }),
  })
  if (!loginRes.ok) { console.error('Login failed:', await loginRes.text()); return }
  const { access_token: token } = await loginRes.json()
  console.log('✅ Logged in, token:', token.substring(0, 20) + '...')

  // 2. Create each modifier group + its modifiers
  for (const group of modifierGroups) {
    const { modifiers, ...groupData } = group
    const gRes = await fetch(`${BASE}/modifiers/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(groupData),
    })
    if (!gRes.ok) { console.error('Failed to create group:', group.name, await gRes.text()); continue }
    const created = await gRes.json()
    console.log(`✅ Group: ${created.name} (id: ${created.id})`)

    for (const mod of modifiers) {
      const mRes = await fetch(`${BASE}/modifiers/groups/${created.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(mod),
      })
      if (!mRes.ok) { console.error('  ❌ Modifier:', mod.name, await mRes.text()); continue }
      const createdMod = await mRes.json()
      console.log(`  ✅ Modifier: ${createdMod.name} (+${createdMod.price} ETB)`)
    }
  }

  // 3. Verify
  const verify = await fetch(`${BASE}/modifiers/public`)
  const result = await verify.json()
  console.log(`\n🎉 Done! ${result.length} modifier groups seeded.`)
}

main().catch(console.error)
