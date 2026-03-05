document.addEventListener("DOMContentLoaded", function () {

const form = document.getElementById("crosstalk-form");
if(!form) return;

form.addEventListener("change", calculate);
form.addEventListener("input", calculate);

function unitPrice(size,sides){

if(size==="7 inch" && sides==="Single-sided") return 75;
if(size==="7 inch" && sides==="Double-sided") return 85;

if(size==="10 inch" && sides==="Single-sided") return 90;
if(size==="10 inch" && sides==="Double-sided") return 100;

if(size==="12 inch" && sides==="Single-sided") return 110;
if(size==="12 inch" && sides==="Double-sided") return 125;

return 0;

}

function calculate(){

const size = document.getElementById("sizeField")?.value;
const sides = document.getElementById("sidesField")?.value;
let qty = parseInt(document.getElementById("qtyField")?.value) || 1;

const copyright = document.getElementById("copyrightStatus");

if(copyright && copyright.value==="nonowner"){
qty = 1;
document.getElementById("qtyField").value = 1;
}

const total = unitPrice(size,sides) * qty;

const display = document.getElementById("priceDisplay");
if(display) display.textContent = "$" + total;

const hidden = document.getElementById("calculatedPrice");
if(hidden) hidden.value = total;

const summary = document.querySelector("[data-summary]");
if(summary){
summary.innerHTML =
"<strong>"+size+" • "+sides+"</strong><br>" +
"Quantity: "+qty+"<br>" +
"<strong>Total: $"+total+"</strong>";
}

}

calculate();

});
