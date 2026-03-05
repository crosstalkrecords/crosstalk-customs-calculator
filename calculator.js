function updateCalculator(){

const form = document.getElementById("crosstalk-form");
if(!form) return;

const sizeField = form.querySelector("#sizeField");
const sidesField = form.querySelector("#sidesField");
const qtyField = form.querySelector("#qtyField");
const copyrightField = form.querySelector("#copyrightStatus");

if(!sizeField || !sidesField || !qtyField) return;

function unitPrice(size,sides){

if(size==="7 inch" && sides==="Single-sided") return 75;
if(size==="7 inch" && sides==="Double-sided") return 85;

if(size==="10 inch" && sides==="Single-sided") return 90;
if(size==="10 inch" && sides==="Double-sided") return 100;

if(size==="12 inch" && sides==="Single-sided") return 110;
if(size==="12 inch" && sides==="Double-sided") return 125;

return 0;
}

let size = sizeField.value;
let sides = sidesField.value;
let qty = parseInt(qtyField.value) || 1;

if(copyrightField && copyrightField.value === "nonowner"){
qty = 1;
qtyField.value = 1;
}

const price = unitPrice(size,sides);
const total = price * qty;

const priceDisplay = document.getElementById("priceDisplay");
if(priceDisplay) priceDisplay.textContent = "$" + total;

const hiddenPrice = document.getElementById("calculatedPrice");
if(hiddenPrice) hiddenPrice.value = total;

const summary = document.querySelector("[data-summary]");
if(summary){
summary.innerHTML =
"<strong>"+size+" • "+sides+"</strong><br>" +
"Quantity: "+qty+"<br>" +
"<strong>Total: $"+total+"</strong>";
}

}

document.addEventListener("DOMContentLoaded", function(){
document.addEventListener("change", updateCalculator);
document.addEventListener("input", updateCalculator);
updateCalculator();
});
