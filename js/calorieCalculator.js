// Calorie Calculator Page Logic

document.addEventListener('DOMContentLoaded', () => {
    const calculatorList = document.getElementById('calculator-list');
    const totalCalories = document.getElementById('total-calories');
    const clearBtn = document.getElementById('clear-calculator');
    const calculatorEmpty = document.getElementById('calculator-empty');

    function renderCalculatorItems() {
        let items = JSON.parse(localStorage.getItem('calculatorItems') || '[]');
        calculatorList.innerHTML = '';
        let total = 0;
        if (items.length === 0) {
            calculatorEmpty.classList.remove('d-none');
            totalCalories.textContent = '0';
            return;
        } else {
            calculatorEmpty.classList.add('d-none');
        }
        items.forEach((item, idx) => {
            total += item.calories;
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-2 p-2 border rounded';
            div.innerHTML = `
                <div>
                    <strong>${item.name}</strong>
                    <span class="badge bg-secondary ms-2">${item.calories} kcal</span>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-item" data-idx="${idx}"><i class="fas fa-trash"></i></button>
            `;
            calculatorList.appendChild(div);
        });
        totalCalories.textContent = total.toFixed(2);

        // Remove item event
        calculatorList.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                items.splice(idx, 1);
                localStorage.setItem('calculatorItems', JSON.stringify(items));
                renderCalculatorItems();
            });
        });
    }

    clearBtn.addEventListener('click', () => {
        if (confirm('Clear all items from calculator?')) {
            localStorage.removeItem('calculatorItems');
            renderCalculatorItems();
        }
    });

    renderCalculatorItems();
});
