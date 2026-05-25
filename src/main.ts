type Ingredient = { name: string; cost: number }

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

let ingredients: Ingredient[] = []
let recipes: Recipe[] = JSON.parse(localStorage.getItem("recipes") || "[]")
let editingIndex: number | null = null

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div class="app">
  <h1>Food Cost AI</h1>
  <p class="subtitle">Smart food costing & profit analysis</p>

  <div class="card">
    <h2>Recipe</h2>
    <input id="recipeName" placeholder="Product / Recipe name" />
    <input id="category" placeholder="Category: Cake / Drink / Bread / Dessert" />
    <input id="image" placeholder="Image URL optional" />

    <h2>Ingredient</h2>
    <input id="name" placeholder="Ingredient name" />
    <input id="cost" type="number" placeholder="Ingredient cost" />

    <button id="addBtn">Add Ingredient</button>
    <button id="clearBtn" class="danger">Clear</button>

    <h2>Pricing</h2>
    <input id="pieces" type="number" placeholder="How many pieces?" />
    <input id="sell" type="number" placeholder="Selling price per piece" />
    <input id="targetMargin" type="number" placeholder="Target margin % e.g. 70" />

    <h2>Extra Cost</h2>
    <input id="packaging" type="number" placeholder="Packaging cost total" />
    <input id="labour" type="number" placeholder="Labour cost total" />
    <input id="rent" type="number" placeholder="Rent / overhead cost total" />

    <div id="list"></div>
    <div id="summary"></div>
    <div id="aiBox"></div>

    <button id="saveBtn" class="save">Save Recipe</button>
    <button id="exportBtn" class="export">Export CSV</button>
  </div>

  <div class="card">
    <h2>Saved Recipes</h2>
    <input id="search" placeholder="Search recipe..." />
    <div id="recipes"></div>
  </div>
</div>

<style>
body{margin:0;font-family:Arial;background:#0f172a;color:white}
.app{max-width:760px;margin:auto;padding:30px}
h1{text-align:center;font-size:42px;margin-bottom:5px}
.subtitle{text-align:center;color:#cbd5e1;margin-bottom:25px}
.card{background:#1e293b;padding:25px;border-radius:22px;margin-bottom:25px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
input{width:100%;padding:14px;margin:8px 0;border:none;border-radius:12px;background:#334155;color:white;font-size:16px;box-sizing:border-box}
button{border:none;border-radius:12px;padding:12px 18px;margin:8px 6px 8px 0;font-size:15px;cursor:pointer;background:#10b981;color:white}
.danger{background:#ef4444}
.save{background:#f97316;width:100%;margin-top:15px}
.export{background:#3b82f6;width:100%}
.item,.recipe{background:#334155;padding:12px;border-radius:12px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.summary{margin-top:20px;font-size:20px;line-height:1.8}
.good{color:#22c55e}.bad{color:#f87171}.warn{color:#facc15}
.aiBox{margin-top:20px;padding:18px;border-radius:16px;background:#111827;line-height:1.8}
.smallBtn{padding:8px 10px;font-size:13px}
img{width:70px;height:70px;object-fit:cover;border-radius:12px}
</style>
`

const $ = (id: string) => document.querySelector(id) as HTMLInputElement

const recipeName = $("#recipeName")
const category = $("#category")
const image = $("#image")
const nameInput = $("#name")
const costInput = $("#cost")
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

function saveLocal(){
  localStorage.setItem("recipes", JSON.stringify(recipes))
}

function totalIngredientCost(){
  return ingredients.reduce((sum,item)=>sum + item.cost,0)
}

function totalExtraCost(){
  return Number(packagingInput.value) + Number(labourInput.value) + Number(rentInput.value)
}

function render(){
  const total = totalIngredientCost() + totalExtraCost()
  const pieces = Number(piecesInput.value)
  const sell = Number(sellInput.value)
  const targetMargin = Number(targetMarginInput.value) || 70

  list.innerHTML = ""

  ingredients.forEach((item,index)=>{
    list.innerHTML += `
      <div class="item">
        <span>${item.name} - $${item.cost.toFixed(2)}</span>
        <button class="danger smallBtn" onclick="deleteItem(${index})">X</button>
      </div>
    `
  })

  const costPerPiece = pieces > 0 ? total / pieces : 0
  const profit = sell > 0 ? sell - costPerPiece : 0
  const margin = sell > 0 ? profit / sell * 100 : 0
  const suggestedPrice = costPerPiece > 0 ? costPerPiece / (1 - targetMargin / 100) : 0

  summary.innerHTML = `
    <div>Total Cost: $${total.toFixed(2)}</div>
    <div>Cost Per Piece: $${costPerPiece.toFixed(2)}</div>
    <div class="${profit >= 0 ? "good" : "bad"}">Profit: $${profit.toFixed(2)}</div>
    <div class="${margin >= targetMargin ? "good" : "warn"}">Margin: ${margin.toFixed(1)}%</div>
    <hr>
    <div>Suggested Price for ${targetMargin}% Margin: $${suggestedPrice.toFixed(2)}</div>
  `

  let msg = ""
  if(sell <= 0) msg = "Enter selling price to analyse profit."
  else if(profit < 0) msg = "❌ Losing money. Increase selling price or reduce cost."
  else if(margin < 40) msg = "⚠ Margin too low. Check ingredient, labour, packaging and rent cost."
  else if(margin < targetMargin) msg = "🙂 Acceptable, but below your target margin."
  else msg = "✅ Healthy pricing. This product has good profit potential."

  aiBox.innerHTML = `<h3>AI Profit Analysis</h3>${msg}`
}

function renderRecipes(){
  const keyword = searchInput.value.toLowerCase()
  recipesBox.innerHTML = ""

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(keyword) ||
    r.category.toLowerCase().includes(keyword)
  )

  if(filtered.length === 0){
    recipesBox.innerHTML = "<p>No saved recipes.</p>"
    return
  }

  filtered.forEach((r)=>{
    const realIndex = recipes.indexOf(r)
    recipesBox.innerHTML += `
      <div class="recipe">
        ${r.image ? `<img src="${r.image}">` : ""}
        <div>
          <b>${r.name}</b><br>
          <small>${r.category || "No category"}</small>
        </div>
        <div>
          <button class="smallBtn" onclick="loadRecipe(${realIndex})">Open</button>
          <button class="smallBtn" onclick="editRecipe(${realIndex})">Edit</button>
          <button class="danger smallBtn" onclick="deleteRecipe(${realIndex})">Delete</button>
        </div>
      </div>
    `
  })
}

document.querySelector("#addBtn")!.addEventListener("click",()=>{
  const name = nameInput.value.trim()
  const cost = Number(costInput.value)

  if(!name || cost <= 0){
    alert("Enter ingredient name and cost")
    return
  }

  ingredients.push({name,cost})
  nameInput.value = ""
  costInput.value = ""
  render()
})

document.querySelector("#clearBtn")!.addEventListener("click",()=>{
  ingredients = []
  editingIndex = null
  recipeName.value = ""
  category.value = ""
  image.value = ""
  piecesInput.value = ""
  sellInput.value = ""
  targetMarginInput.value = ""
  packagingInput.value = ""
  labourInput.value = ""
  rentInput.value = ""
  render()
})

document.querySelector("#saveBtn")!.addEventListener("click",()=>{
  const data: Recipe = {
    name: recipeName.value.trim(),
    category: category.value.trim(),
    image: image.value.trim(),
    ingredients:[...ingredients],
    pieces:Number(piecesInput.value),
    sell:Number(sellInput.value),
    targetMargin:Number(targetMarginInput.value) || 70,
    packaging:Number(packagingInput.value),
    labour:Number(labourInput.value),
    rent:Number(rentInput.value)
  }

  if(!data.name || data.ingredients.length === 0){
    alert("Enter recipe name and ingredients")
    return
  }

  if(editingIndex === null) recipes.push(data)
  else {
    recipes[editingIndex] = data
    editingIndex = null
  }

  saveLocal()
  renderRecipes()
  alert("Recipe saved")
})

document.querySelector("#exportBtn")!.addEventListener("click",()=>{
  let csv = "Recipe,Category,Ingredient,Cost,Pieces,Sell Price,Target Margin,Packaging,Labour,Rent\\n"

  recipes.forEach(r=>{
    r.ingredients.forEach(i=>{
      csv += `${r.name},${r.category},${i.name},${i.cost},${r.pieces},${r.sell},${r.targetMargin},${r.packaging},${r.labour},${r.rent}\\n`
    })
  })

  const blob = new Blob([csv], {type:"text/csv"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "food-cost-recipes.csv"
  a.click()
})

;(window as any).deleteItem = (index:number)=>{
  ingredients.splice(index,1)
  render()
}

;(window as any).loadRecipe = (index:number)=>{
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

;(window as any).editRecipe = (index:number)=>{
  ;(window as any).loadRecipe(index)
  editingIndex = index
  alert("Editing mode")
}

;(window as any).deleteRecipe = (index:number)=>{
  recipes.splice(index,1)
  saveLocal()
  renderRecipes()
}

searchInput.addEventListener("input",renderRecipes)

;[piecesInput,sellInput,targetMarginInput,packagingInput,labourInput,rentInput].forEach(input=>{
  input.addEventListener("input",render)
})

render()
renderRecipes()