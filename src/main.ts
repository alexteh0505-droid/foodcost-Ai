import "./firebase"

type Ingredient = {
  name: string
  packagePrice: number
  packageSize: number
  usedAmount: number
  unit: string
  cost: number
}

type Recipe = {
  name: string
  category: string
  image: string
  ingredients: Ingredient[]
  pieces: number
  sell: number
  targetMargin: number
  packaging: number
  labour: number
  rent: number
}

let lang = localStorage.getItem("lang") || "en"
let ingredients: Ingredient[] = []
let recipes: Recipe[] = JSON.parse(localStorage.getItem("recipes") || "[]")
let editingIndex: number | null = null

const text: any = {
  en: {
    title: "Food Cost AI",
    subtitle: "Smart food costing & profit analysis",
    recipe: "Recipe",
    product: "Product / Recipe name",
    category: "Category",
    image: "Image URL optional",
    ingredient: "Ingredient",
    ingredientName: "Ingredient name",
    packagePrice: "Package price",
    packageSize: "Package size / weight",
    usedAmount: "Used amount",
    unit: "Unit: g / kg / ml / pcs",
    add: "Add Ingredient",
    clear: "Clear",
    pricing: "Pricing",
    pieces: "How many pieces?",
    sell: "Selling price per piece",
    target: "Target margin %",
    extra: "Extra Cost",
    packaging: "Packaging cost total",
    labour: "Labour cost total",
    rent: "Rent / overhead cost total",
    save: "Save Recipe",
    saved: "Saved Recipes",
    search: "Search recipe...",
    total: "Total Cost",
    perPiece: "Cost Per Piece",
    profit: "Profit",
    margin: "Margin",
    suggested: "Suggested Price",
    ai: "AI Profit Analysis",
    open: "Open",
    edit: "Edit",
    delete: "Delete",
    export: "Export CSV"
  },
  zh: {
    title: "食品成本 AI",
    subtitle: "智能食品成本与利润分析",
    recipe: "配方资料",
    product: "产品 / 配方名称",
    category: "分类",
    image: "图片网址（可选）",
    ingredient: "材料成本",
    ingredientName: "材料名称",
    packagePrice: "买入价格",
    packageSize: "包装重量 / 数量",
    usedAmount: "本配方用量",
    unit: "单位：g / kg / ml / pcs",
    add: "添加材料",
    clear: "清除",
    pricing: "售价分析",
    pieces: "可做多少个？",
    sell: "每个售价",
    target: "目标利润率 %",
    extra: "额外成本",
    packaging: "包装总成本",
    labour: "人工总成本",
    rent: "租金 / 杂费总成本",
    save: "保存配方",
    saved: "已保存配方",
    search: "搜索配方...",
    total: "总成本",
    perPiece: "每个成本",
    profit: "利润",
    margin: "利润率",
    suggested: "建议售价",
    ai: "AI 利润分析",
    open: "打开",
    edit: "编辑",
    delete: "删除",
    export: "导出 CSV"
  }
}

const t = () => text[lang]

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div class="app">
  <select id="langSelect">
    <option value="en">English</option>
    <option value="zh">中文</option>
  </select>

  <h1>${t().title}</h1>
  <p class="subtitle">${t().subtitle}</p>

  <div class="card">
    <h2>${t().recipe}</h2>
    <input id="recipeName" placeholder="${t().product}" />
    <input id="category" placeholder="${t().category}" />
    <input id="image" placeholder="${t().image}" />

    <h2>${t().ingredient}</h2>
    <input id="name" placeholder="${t().ingredientName}" />
    <input id="packagePrice" type="number" placeholder="${t().packagePrice}" />
    <input id="packageSize" type="number" placeholder="${t().packageSize}" />
    <input id="usedAmount" type="number" placeholder="${t().usedAmount}" />
    <input id="unit" placeholder="${t().unit}" />

    <button id="addBtn">${t().add}</button>
    <button id="clearBtn" class="danger">${t().clear}</button>

    <div id="list"></div>

    <h2>${t().extra}</h2>
    <input id="packaging" type="number" placeholder="${t().packaging}" />
    <input id="labour" type="number" placeholder="${t().labour}" />
    <input id="rent" type="number" placeholder="${t().rent}" />

    <h2>${t().pricing}</h2>
    <input id="pieces" type="number" placeholder="${t().pieces}" />
    <input id="sell" type="number" placeholder="${t().sell}" />
    <input id="targetMargin" type="number" placeholder="${t().target}" />

    <div id="summary"></div>
    <div id="aiBox"></div>

    <button id="saveBtn" class="save">${t().save}</button>
    <button id="exportBtn" class="export">${t().export}</button>
  </div>

  <div class="card">
    <h2>${t().saved}</h2>
    <input id="search" placeholder="${t().search}" />
    <div id="recipes"></div>
  </div>
</div>

<style>
body{margin:0;font-family:Arial;background:#0f172a;color:white}
.app{max-width:760px;margin:auto;padding:30px}
select,input{width:100%;padding:14px;margin:8px 0;border:none;border-radius:12px;background:#334155;color:white;font-size:16px;box-sizing:border-box}
h1{text-align:center;font-size:42px}
.subtitle{text-align:center;color:#cbd5e1}
.card{background:#1e293b;padding:25px;border-radius:22px;margin-bottom:25px}
button{border:none;border-radius:12px;padding:12px 18px;margin:8px 6px 8px 0;font-size:15px;background:#10b981;color:white}
.danger{background:#ef4444}
.save{background:#f97316;width:100%}
.export{background:#3b82f6;width:100%}
.item,.recipe{background:#334155;padding:12px;border-radius:12px;margin-top:10px;display:flex;justify-content:space-between;gap:10px}
.good{color:#22c55e}.bad{color:#f87171}.warn{color:#facc15}
#summary,#aiBox{margin-top:20px;font-size:18px;line-height:1.8}
</style>
`

const $ = (id: string) => document.querySelector(id) as HTMLInputElement

const recipeName = $("#recipeName")
const category = $("#category")
const image = $("#image")
const nameInput = $("#name")
const packagePriceInput = $("#packagePrice")
const packageSizeInput = $("#packageSize")
const usedAmountInput = $("#usedAmount")
const unitInput = $("#unit")
const piecesInput = $("#pieces")
const sellInput = $("#sell")
const targetMarginInput = $("#targetMargin")
const packagingInput = $("#packaging")
const labourInput = $("#labour")
const rentInput = $("#rent")
const searchInput = $("#search")

const list = document.querySelector("#list") as HTMLDivElement
const summary = document.querySelector("#summary") as HTMLDivElement
const aiBox = document.querySelector("#aiBox") as HTMLDivElement
const recipesBox = document.querySelector("#recipes") as HTMLDivElement
const langSelect = document.querySelector("#langSelect") as HTMLSelectElement

langSelect.value = lang
langSelect.addEventListener("change", () => {
  localStorage.setItem("lang", langSelect.value)
  location.reload()
})

function saveLocal() {
  localStorage.setItem("recipes", JSON.stringify(recipes))
}

function ingredientTotal() {
  return ingredients.reduce((sum, i) => sum + i.cost, 0)
}

function extraTotal() {
  return Number(packagingInput.value) + Number(labourInput.value) + Number(rentInput.value)
}

function render() {
  const total = ingredientTotal() + extraTotal()
  const pieces = Number(piecesInput.value)
  const sell = Number(sellInput.value)
  const targetMargin = Number(targetMarginInput.value) || 70

  list.innerHTML = ""
  ingredients.forEach((i, index) => {
    list.innerHTML += `
      <div class="item">
        <div>
          <b>${i.name}</b><br>
          ${i.usedAmount}${i.unit} / ${i.packageSize}${i.unit} × $${i.packagePrice}
          <br>
          Cost: $${i.cost.toFixed(2)}
        </div>
        <button class="danger" onclick="deleteItem(${index})">X</button>
      </div>
    `
  })

  const costPerPiece = pieces > 0 ? total / pieces : 0
  const profit = sell > 0 ? sell - costPerPiece : 0
  const margin = sell > 0 ? (profit / sell) * 100 : 0
  const suggested = costPerPiece > 0 ? costPerPiece / (1 - targetMargin / 100) : 0

  summary.innerHTML = `
    ${t().total}: $${total.toFixed(2)}<br>
    ${t().perPiece}: $${costPerPiece.toFixed(2)}<br>
    <span class="${profit >= 0 ? "good" : "bad"}">${t().profit}: $${profit.toFixed(2)}</span><br>
    <span class="${margin >= targetMargin ? "good" : "warn"}">${t().margin}: ${margin.toFixed(1)}%</span><br>
    ${t().suggested}: $${suggested.toFixed(2)}
  `

  aiBox.innerHTML = `
    <h3>${t().ai}</h3>
    ${
      sell <= 0
        ? lang === "zh" ? "请输入售价进行 AI 分析" : "Enter selling price for analysis"
        : profit < 0
        ? lang === "zh" ? "正在亏损，请提高售价或降低成本" : "Losing money. Increase price or reduce cost."
        : margin < 40
        ? lang === "zh" ? "利润率偏低，请检查材料、人工和租金" : "Margin is low. Check ingredient, labour and rent."
        : lang === "zh" ? "利润健康，产品有盈利空间" : "Healthy profit margin."
    }
  `
}

function renderRecipes() {
  const keyword = searchInput.value.toLowerCase()
  recipesBox.innerHTML = ""

  recipes
    .filter(r => r.name.toLowerCase().includes(keyword) || r.category.toLowerCase().includes(keyword))
    .forEach((r, index) => {
      recipesBox.innerHTML += `
        <div class="recipe">
          <div>
            <b>${r.name}</b><br>
            <small>${r.category}</small>
          </div>
          <div>
            <button onclick="loadRecipe(${index})">${t().open}</button>
            <button onclick="editRecipe(${index})">${t().edit}</button>
            <button class="danger" onclick="deleteRecipe(${index})">${t().delete}</button>
          </div>
        </div>
      `
    })
}

document.querySelector("#addBtn")!.addEventListener("click", () => {
  const name = nameInput.value.trim()
  const packagePrice = Number(packagePriceInput.value)
  const packageSize = Number(packageSizeInput.value)
  const usedAmount = Number(usedAmountInput.value)
  const unit = unitInput.value.trim()

  if (!name || packagePrice <= 0 || packageSize <= 0 || usedAmount <= 0) {
    alert("Please fill ingredient correctly")
    return
  }

  const cost = (usedAmount / packageSize) * packagePrice

  ingredients.push({ name, packagePrice, packageSize, usedAmount, unit, cost })

  nameInput.value = ""
  packagePriceInput.value = ""
  packageSizeInput.value = ""
  usedAmountInput.value = ""
  unitInput.value = ""

  render()
})

document.querySelector("#clearBtn")!.addEventListener("click", () => {
  ingredients = []
  recipeName.value = ""
  category.value = ""
  image.value = ""
  piecesInput.value = ""
  sellInput.value = ""
  targetMarginInput.value = ""
  packagingInput.value = ""
  labourInput.value = ""
  rentInput.value = ""
  editingIndex = null
  render()
})

document.querySelector("#saveBtn")!.addEventListener("click", () => {
  const data: Recipe = {
    name: recipeName.value,
    category: category.value,
    image: image.value,
    ingredients: [...ingredients],
    pieces: Number(piecesInput.value),
    sell: Number(sellInput.value),
    targetMargin: Number(targetMarginInput.value) || 70,
    packaging: Number(packagingInput.value),
    labour: Number(labourInput.value),
    rent: Number(rentInput.value)
  }

  if (!data.name || data.ingredients.length === 0) {
    alert("Please add recipe")
    return
  }

  if (editingIndex === null) recipes.push(data)
  else recipes[editingIndex] = data

  editingIndex = null
  saveLocal()
  renderRecipes()
  alert("Recipe saved")
})

document.querySelector("#exportBtn")!.addEventListener("click", () => {
  let csv = "Recipe,Category,Ingredient,Package Price,Package Size,Used,Unit,Cost\n"
  recipes.forEach(r => {
    r.ingredients.forEach(i => {
      csv += `${r.name},${r.category},${i.name},${i.packagePrice},${i.packageSize},${i.usedAmount},${i.unit},${i.cost}\n`
    })
  })

  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "food-cost.csv"
  a.click()
})

;(window as any).deleteItem = (index: number) => {
  ingredients.splice(index, 1)
  render()
}

;(window as any).loadRecipe = (index: number) => {
  const r = recipes[index]
  recipeName.value = r.name
  category.value = r.category
  image.value = r.image
  ingredients = [...r.ingredients]
  piecesInput.value = String(r.pieces)
  sellInput.value = String(r.sell)
  targetMarginInput.value = String(r.targetMargin)
  packagingInput.value = String(r.packaging)
  labourInput.value = String(r.labour)
  rentInput.value = String(r.rent)
  render()
}

;(window as any).editRecipe = (index: number) => {
  ;(window as any).loadRecipe(index)
  editingIndex = index
}

;(window as any).deleteRecipe = (index: number) => {
  recipes.splice(index, 1)
  saveLocal()
  renderRecipes()
}

searchInput.addEventListener("input", renderRecipes)

;[
  piecesInput,
  sellInput,
  targetMarginInput,
  packagingInput,
  labourInput,
  rentInput
].forEach(input => input.addEventListener("input", render))

render()
renderRecipes()