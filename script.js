let order = [];
let totalPrice = 0;

function addToOrder(item, price, button) {
    const existingItem = order.find(orderItem => orderItem.item === item);

    if (existingItem) {
        existingItem.quantity += 1;
        totalPrice += price;
    } else {
        button.textContent = 'Added';
        order.push({ item, price, quantity: 1 });
        totalPrice += price;
    }

    updateOrderSummary();
}

function removeFromOrder(item) {
    const existingItem = order.find(orderItem => orderItem.item === item);

    if (existingItem) {
        totalPrice -= existingItem.price;
        existingItem.quantity -= 1;

        if (existingItem.quantity === 0) {
            order = order.filter(orderItem => orderItem.item !== item);
        }
    }

    updateOrderSummary();
}

function updateOrderSummary() {
    const orderSummary = document.getElementById('order-summary');
    orderSummary.innerHTML = '';

    order.forEach(orderItem => {
        const div = document.createElement('div');
        div.className = 'd-flex justify-content-between mb-2';

        div.innerHTML = `
            <span>${orderItem.item} (x${orderItem.quantity})</span>
            <span>${orderItem.price * orderItem.quantity} ₹</span>
            <div>
                <button onclick="removeFromOrder('${orderItem.item}')">-</button>
                <button onclick="addToOrder('${orderItem.item}', ${orderItem.price}, this)">+</button>
            </div>
        `;
        orderSummary.appendChild(div);
    });

    const total = document.createElement('div');
    const minitotal = document.querySelector('.minitotal');
    total.className = 'd-flex justify-content-between border-top pt-2';
    total.innerHTML = `<span><strong>Total</strong></span><span>${totalPrice} ₹</span>`;
    minitotal.innerHTML = `<span><strong>Total:&nbsp;&nbsp;</strong></span><span style="font-size:20px">${totalPrice} ₹</span>`;
    orderSummary.appendChild(total);
}

function confirmPayment(paymentMethod) {
    if (order.length === 0) {
        alert('No items in your order. Please add some items before proceeding.');
        return;
    }

    let payer_name, payer_mobile;

    // Check for payment method and get payer details accordingly
    if (paymentMethod === 'UPI') {
        payer_name = document.querySelector('.upiDetails input[name="payer_name"]').value;
        payer_mobile = document.querySelector('.upiDetails input[name="payer_mobile"]').value;
    } else if (paymentMethod === 'Credit Card') {
        payer_name = document.querySelector('.creditDetails input[name="payer_name"]').value;
        payer_mobile = document.querySelector('.creditDetails input[name="payer_mobile"]').value;
        const card_number = document.querySelector('.creditDetails input[name="card_number"]').value;
        const cvv = document.querySelector('.creditDetails input[name="cvv"]').value;
        const exp_date = document.querySelector('.creditDetails input[name="exp_date"]').value;

        // Validate card details
        if (!card_number || !cvv || !exp_date) {
            alert('Please fill in all card details.');
            return;
        }
    } else if (paymentMethod === 'Dine-in') {
        payer_name = document.querySelector('.dineinDetails input[name="payer_name"]').value;
        payer_mobile = document.querySelector('.dineinDetails input[name="payer_mobile"]').value;
    }

    // Validate mobile number (for 10 digits)
    if (!/^\d{10}$/.test(payer_mobile)) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
    }

    const orderData = {
        order: order,
        payer_name: payer_name,
        payer_mobile: payer_mobile,
        payment_method: paymentMethod
    };

    fetch('save_order.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert(data.message);
            resetOrder();
            updateOrderSummary();
            clearPaymentInputs(paymentMethod);
            location.reload();
        } else {
            alert('Failed to save order.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while saving the order.');
    });
}

function clearPaymentInputs(paymentMethod) {
    const inputs = document.querySelectorAll(`.${paymentMethod.toLowerCase()}Details input`);
    inputs.forEach(input => {
        input.value = '';
    });
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('hidden.bs.modal', () => {
        const method = modal.id;
        clearPaymentInputs(method);
    });
});

function resetOrder() {
    order = [];
    totalPrice = 0;
    document.getElementById('bill-summary').innerHTML = '';
    document.getElementById('total-bill').innerText = '0 ₹';
}

document.querySelector('[data-bs-target="#billModal"]').addEventListener('click', () => {
    const billSummary = document.getElementById('bill-summary');
    billSummary.innerHTML = '';

    order.forEach(orderItem => {
        createOrderOrBillItem(billSummary, orderItem);
    });

    document.getElementById('total-bill').innerText = `${totalPrice} ₹`;
});

function createOrderOrBillItem(container, orderItem) {
    const div = document.createElement('div');
    div.className = 'd-flex justify-content-between mb-2';
    div.innerHTML = `<span>${orderItem.item}</span><span>${orderItem.price} ₹</span>`;
    container.appendChild(div);
}
