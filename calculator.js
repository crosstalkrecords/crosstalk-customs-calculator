document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("crosstalk-form");
if (!form) return;

/* ================= PRICING TABLE ================= */

const pricing = {
  "7 inch": {
    "Single-sided": 75,
    "Double-sided": 85
  },
  "10 inch": {
    "Single-sided": 90,
    "Double-sided": 100
  },
  "12 inch": {
    "Single-sided": 110,
    "Double-sided": 125
  }
};

/* ================= ELEMENTS ================= */

const sizeField = form.querySelector("#sizeField");
const sidesField = form.querySelector("#sidesField");
const qtyField = form.querySelector("#qtyField");
const copyrightField = form.querySelector("#copyrightStatus");

const priceDisplay = document.getElementById("priceDisplay");
const hiddenPrice = document.getElementById("calculatedPrice");
const summary = document.querySelector("[data-summary]");

/* ================= CALCULATOR ================= */

function updateCalculator(){

const size = sizeField.value;
const sides = sidesField.value;

let qty = parseInt(qtyField.value) || 1;

/* copyright rule */

if(copyrightField.value === "nonowner"){
  qty = 1;
  qtyField.value = 1;
}

/* max quantity rule */

if(qty > 5){
  qty = 5;
  qtyField.value = 5;
}

/* get price */

const unitPrice =
  pricing[size] &&
  pricing[size][sides]
  ? pricing[size][sides]
  : 0;

const total = unitPrice * qty;

/* update UI */

if(priceDisplay){
  priceDisplay.textContent = "$" + total;
}

if(hiddenPrice){
  hiddenPrice.value = total;
}

/* update summary */

if(summary){

summary.innerHTML =

`<strong>${size || "Select size"} • ${sides}</strong><br>
Quantity: ${qty}<br>
Unit price: $${unitPrice}<br>
<strong>Total: $${total}</strong>`;

}

}

/* ================= EVENTS ================= */

form.addEventListener("change", updateCalculator);
form.addEventListener("input", updateCalculator);

/* initial run */

updateCalculator();

});
