import './style.css'

/* ═══════════════════════════════════════════
   FREZO LANDING PAGE — main.js
   ═══════════════════════════════════════════ */

// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar')
const navToggle = document.getElementById('nav-toggle')

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) navbar.classList.add('scrolled')
  else navbar.classList.remove('scrolled')
})

navToggle?.addEventListener('click', () => {
  navbar.classList.toggle('open')
})

// Close mobile menu on link click
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navbar.classList.remove('open'))
})

// ── HERO PARTICLES ──
function createParticles() {
  const container = document.getElementById('hero-particles')
  if (!container) return
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div')
    p.classList.add('particle')
    const size = Math.random() * 4 + 2
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * -20}s;
      opacity: ${Math.random() * 0.6 + 0.1};
    `
    container.appendChild(p)
  }
}
createParticles()

// ── REVEAL ON SCROLL ──
function setupReveal() {
  const targets = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right')
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60)
        io.unobserve(e.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  targets.forEach(t => io.observe(t))
}
setupReveal()

// ── PRODUCT DATA ──
const products = [
  { id: 'p1', name: 'Cải Xanh Bó', origin: 'Đà Lạt', price: '12.000', unit: '/bó', emoji: '🥬', category: 'leafy',  badge: 'fresh',   badgeText: 'Tươi mới' },
  { id: 'p2', name: 'Cà Chua Bi',  origin: 'Lâm Đồng', price: '28.000', unit: '/kg',  emoji: '🍅', category: 'root',   badge: 'organic', badgeText: 'Organic' },
  { id: 'p3', name: 'Xà Lách Lô Lô', origin: 'Mộc Châu', price: '18.000', unit: '/bó', emoji: '🥗', category: 'leafy',  badge: 'organic', badgeText: 'Organic' },
  { id: 'p4', name: 'Cà Rốt',      origin: 'Đà Lạt', price: '22.000', unit: '/kg',  emoji: '🥕', category: 'root',   badge: 'fresh',   badgeText: 'Tươi mới' },
  { id: 'p5', name: 'Húng Quế',    origin: 'Vĩnh Phúc', price: '8.000',  unit: '/bó', emoji: '🌿', category: 'herb',   badge: 'fresh',   badgeText: 'Tươi mới' },
  { id: 'p6', name: 'Bông Cải Xanh', origin: 'Đà Lạt', price: '35.000', unit: '/kg', emoji: '🥦', category: 'leafy',  badge: 'organic', badgeText: 'Organic' },
  { id: 'p7', name: 'Bí Đỏ',       origin: 'Gia Lai',  price: '25.000', unit: '/kg',  emoji: '🎃', category: 'root',   badge: 'sale',    badgeText: '-20%' },
  { id: 'p8', name: 'Rau Muống',   origin: 'Hưng Yên', price: '10.000', unit: '/bó', emoji: '🌱', category: 'leafy',  badge: 'fresh',   badgeText: 'Tươi mới' },
  { id: 'p9', name: 'Ngò Rí',      origin: 'Đà Lạt',   price: '6.000',  unit: '/bó', emoji: '🍃', category: 'herb',   badge: 'organic', badgeText: 'Organic' },
  { id: 'p10', name: 'Dưa Leo',    origin: 'Bình Dương', price: '20.000', unit: '/kg', emoji: '🥒', category: 'root',  badge: 'fresh',   badgeText: 'Tươi mới' },
  { id: 'p11', name: 'Cải Ngọt',   origin: 'Đà Lạt',   price: '14.000', unit: '/bó', emoji: '🥬', category: 'leafy', badge: 'organic', badgeText: 'Organic' },
  { id: 'p12', name: 'Tía Tô',     origin: 'Hà Nam',    price: '7.000',  unit: '/bó', emoji: '🌾', category: 'herb',  badge: 'fresh',   badgeText: 'Tươi mới' },
]

function renderProducts(filter = 'all') {
  const grid = document.getElementById('products-grid')
  if (!grid) return
  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter || (filter === 'organic' && p.badge === 'organic'))
  grid.innerHTML = filtered.map(p => `
    <div class="product-card reveal-up" id="${p.id}" data-cat="${p.category}">
      <div class="pc-img-wrap">
        <div class="pc-emoji">${p.emoji}</div>
        <span class="pc-badge ${p.badge}">${p.badgeText}</span>
      </div>
      <div class="pc-body">
        <div class="pc-name">${p.name}</div>
        <div class="pc-origin">📍 ${p.origin}</div>
        <div class="pc-price-row">
          <div>
            <span class="pc-price">${p.price}đ</span>
            <span class="pc-unit"> ${p.unit}</span>
          </div>
          <button class="pc-add" onclick="addToCart('${p.id}', '${p.name}')" aria-label="Thêm vào giỏ">+</button>
        </div>
      </div>
    </div>
  `).join('')
  setupReveal()
}

renderProducts()

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    renderProducts(btn.dataset.filter)
  })
})

// Add to cart toast
window.addToCart = (id, name) => {
  showToast(`✅ Đã thêm "${name}" vào giỏ hàng!`)
}

// ── AUTOMATION PIPELINE ──
const pipelineData = [
  {
    icon: '🌱',
    title: 'Hệ thống Gieo Trồng Tự Động',
    desc: 'Robot gieo hạt chính xác từng mm, đảm bảo khoảng cách và độ sâu lý tưởng. AI tính toán mật độ gieo phù hợp với từng loại cây và mùa vụ.',
    tags: ['Robot gieo hạt', 'AI lập kế hoạch', 'Hạt giống chuẩn', 'Ghi nhận lô']
  },
  {
    icon: '💧',
    title: 'Tưới Tiêu Drip Irrigation',
    desc: 'Hàng nghìn vòi tưới nhỏ giọt được điều khiển bởi cảm biến độ ẩm đất. Cung cấp đúng lượng nước, đúng thời điểm — tiết kiệm 60% nước so với tưới truyền thống.',
    tags: ['Drip irrigation', 'Soil moisture sensor', 'Tiết kiệm 60% nước', 'Tự động hóa']
  },
  {
    icon: '📡',
    title: 'Giám Sát IoT 24/7',
    desc: '1,000+ cảm biến theo dõi nhiệt độ, độ ẩm không khí, CO₂, ánh sáng PAR và dinh dưỡng đất. Dữ liệu cập nhật mỗi 30 giây lên dashboard quản lý.',
    tags: ['1,000+ sensors', 'Real-time data', 'Cloud dashboard', 'Alert system']
  },
  {
    icon: '🤖',
    title: 'Thu Hoạch Robot Tự Động',
    desc: 'Cánh tay robot kết hợp vision AI nhận diện và thu hoạch rau đúng độ chín, nhẹ nhàng không làm giập. Năng suất gấp 8 lần lao động thủ công.',
    tags: ['Computer Vision', 'Gentle harvesting', 'Năng suất x8', 'Zero damage']
  },
  {
    icon: '🚚',
    title: 'Logistics Lạnh Thông Minh',
    desc: 'Xe chuyên dụng duy trì nhiệt độ 2-8°C, theo dõi GPS realtime. Rau thu hoạch đến tay khách hàng trong vòng 24 giờ, đảm bảo độ tươi tối đa.',
    tags: ['Cold chain 2-8°C', 'GPS tracking', 'Giao trong 24h', 'Đóng gói sạch']
  }
]

let currentStep = 0
let pipelineTimer

function setStep(step) {
  currentStep = step
  document.querySelectorAll('.pipe-step').forEach((el, i) => {
    el.classList.toggle('active', i === step)
  })
  const d = pipelineData[step]
  const display = document.getElementById('pipeline-display')
  if (!display) return
  display.innerHTML = `
    <div class="pd-content">
      <div class="pd-icon">${d.icon}</div>
      <div>
        <div class="pd-title">${d.title}</div>
        <div class="pd-desc">${d.desc}</div>
        <div class="pd-tags">${d.tags.map(t => `<span class="pd-tag">${t}</span>`).join('')}</div>
      </div>
    </div>
  `
}

setStep(0)

document.querySelectorAll('.pipe-step').forEach((el, i) => {
  el.addEventListener('click', () => {
    clearInterval(pipelineTimer)
    setStep(i)
    startPipelineAuto()
  })
})

function startPipelineAuto() {
  pipelineTimer = setInterval(() => {
    setStep((currentStep + 1) % pipelineData.length)
  }, 3500)
}
startPipelineAuto()

// ── TESTIMONIAL SLIDER ──
const track = document.getElementById('testi-track')
const cards = track?.querySelectorAll('.testi-card')
const dotsContainer = document.getElementById('testi-dots')
let currentTesti = 0
let cardsPerView = 3

function getCardsPerView() {
  return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3
}

function buildDots() {
  if (!dotsContainer || !cards) return
  cardsPerView = getCardsPerView()
  const total = Math.ceil(cards.length / cardsPerView)
  dotsContainer.innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="testi-dot${i === 0 ? ' active' : ''}" data-idx="${i}" id="testi-dot-${i}"></div>`
  ).join('')
  dotsContainer.querySelectorAll('.testi-dot').forEach(dot => {
    dot.addEventListener('click', () => goToTesti(+dot.dataset.idx))
  })
}

function goToTesti(idx) {
  if (!track || !cards) return
  cardsPerView = getCardsPerView()
  const maxIdx = Math.ceil(cards.length / cardsPerView) - 1
  currentTesti = Math.max(0, Math.min(idx, maxIdx))
  const cardW = cards[0].offsetWidth + 24
  track.style.transform = `translateX(-${currentTesti * cardsPerView * cardW}px)`
  document.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('active', i === currentTesti))
}

buildDots()
window.addEventListener('resize', buildDots)
document.getElementById('testi-next')?.addEventListener('click', () => goToTesti(currentTesti + 1))
document.getElementById('testi-prev')?.addEventListener('click', () => goToTesti(currentTesti - 1))

// Auto-slide testimonials
setInterval(() => goToTesti(currentTesti + 1), 5000)

// ── STAT COUNT UP ──
function countUp(el, target) {
  const duration = 2000
  const start = Date.now()
  const update = () => {
    const progress = Math.min((Date.now() - start) / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 4)
    const val = Math.round(ease * target)
    el.textContent = val >= 1000 ? val.toLocaleString('vi-VN') : val
    if (progress < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

const statCards = document.querySelectorAll('.stat-card')
const statIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const numEl = e.target.querySelector('.stat-num')
      if (numEl) countUp(numEl, +numEl.dataset.target)
      statIO.unobserve(e.target)
    }
  })
}, { threshold: 0.5 })
statCards.forEach(c => statIO.observe(c))

// ── CONTACT FORM ──
const form = document.getElementById('contact-form')
form?.addEventListener('submit', (e) => {
  e.preventDefault()
  const btn = document.getElementById('submit-contact-btn')
  const txt = document.getElementById('submit-text')
  btn.disabled = true
  txt.textContent = 'Đang gửi...'
  setTimeout(() => {
    btn.disabled = false
    txt.textContent = 'Gửi đăng ký ngay'
    form.reset()
    showToast('🎉 Đăng ký thành công! Chúng tôi sẽ liên hệ sớm.')
  }, 1500)
})

// ── TOAST ──
let toastTimer
function showToast(msg) {
  const toast = document.getElementById('toast')
  const toastMsg = document.getElementById('toast-msg')
  if (!toast || !toastMsg) return
  toastMsg.textContent = msg
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500)
}

// ── SMOOTH SCROLL POLISH ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'))
    if (target) {
      e.preventDefault()
      const offset = 80
      const top = target.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  })
})

console.log('%c🌿 Frezo Landing Page', 'color: #22c55e; font-size: 18px; font-weight: 800;')
console.log('%cBuild với ❤️ – Rau sạch cho mọi nhà', 'color: #16a34a; font-size: 13px;')
