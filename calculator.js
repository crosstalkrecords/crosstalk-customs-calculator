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

const pricing={
'7 inch':{'Single-sided':75,'Double-sided':85},
'10 inch':{'Single-sided':90,'Double-sided':100},
'12 inch':{'Single-sided':110,'Double-sided':125}
};

const form=document.getElementById('crosstalk-form');
if(!form)return;

const size=form.querySelector('#sizeField')?.value;
const sides=form.querySelector('#sidesField')?.value;
const qtyField=form.querySelector('#qtyField');
const copyrightField=form.querySelector('#copyrightStatus');

let qty=parseInt(qtyField.value)||1;

if(copyrightField && copyrightField.value==='nonowner'){
qty=1;
qtyField.value=1;
}

if(qty>5){
qty=5;
qtyField.value=5;
}

const unit=(pricing[size] && pricing[size][sides]) || 0;
const total=unit*qty;

document.getElementById('priceDisplay').textContent='$'+total;
document.getElementById('calculatedPrice').value=total;

const summary=document.querySelector('[data-summary]');
if(summary && size && sides){
summary.innerHTML =
'<strong>'+size+' • '+sides+'</strong><br>'+
'Quantity: '+qty+'<br>'+
'Unit price: $'+unit+'<br>'+
'<strong>Total: $'+total+'</strong>';
}

}

document.addEventListener("change",updateCalculator);
document.addEventListener("input",updateCalculator);
