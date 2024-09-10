// Set global options for Chart.js
Chart.defaults.color = 'white';

// Initialize the chart with empty data
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: '',
            data: [],
            fill: true,
            borderColor: 'white',
            backgroundColor: createWhiteGradient(ctx),
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'white'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 30 } },
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    title: function(tooltipItems, data) {
                        return tooltipItems[0].label;
                    },
                    label: function(tooltipItem, data) {
                        const formattedValue = tooltipItem.formattedValue.replace('.', ',');
                        document.getElementById('today-price').textContent = `${formattedValue}€`;
                        return null;
                    }
                }
            }
        },
        scales: {
            y: { beginAtZero: true, ticks: { display: false }, grid: { display: false } },
            x: { ticks: { display: false }, grid: { display: false } }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
});

// Function to create a white gradient
function createWhiteGradient(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    return gradient;
}

function updateChart(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
    updateIndicatorAndPerformance(data);
}

    function getDateRangeForPeriod(period) {
        const today = new Date();
        const launchDate = '2019-11-13';
        let dateFrom, dateTo;

        switch (period) {
            case 'month':
                dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split('T')[0];
                dateTo = today.toISOString().split('T')[0];
                break;
            case 'year':
                dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 365).toISOString().split('T')[0];
                dateTo = today.toISOString().split('T')[0];
                break;
            case 'alltime':
                dateFrom = launchDate;
                dateTo = today.toISOString().split('T')[0];
                break;
        }

        // Update date1, date2, and datum elements
        document.getElementById('date1').textContent = formatDate(dateFrom);
        document.getElementById('date2').textContent = formatDate(dateTo);
        document.getElementById('datum').textContent = `Zeitraum: ${formatDate(dateFrom)} bis ${formatDate(dateTo)}`;

        return { dateFrom, dateTo };
    }

function formatDate(dateStr) {
    if (!dateStr) return 'Anfang';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
}

function fetchDataAndUpdateChart(period) {
    const { dateFrom, dateTo } = getDateRangeForPeriod(period);
    let apiUrl = `https://api.extraetf.com/customer-api/ic/chart/?isin=AT0000A2B4T3&data_type=nav`;
    if (dateFrom && dateTo) {
        apiUrl += `&date_from=${dateFrom}&date_to=${dateTo}`;
    }

    fetch(apiUrl)
        .then(response => response.json())
        .then(apiData => {
            const labels = apiData.results.nav.map(entry => formatDate(entry.date));
            const data = apiData.results.nav.map(entry => entry.value);

            const minValue = Math.min(...data);
            const maxValue = Math.max(...data);
            const padding = (maxValue - minValue) * 0.2;
            myChart.options.scales.y.min = minValue - padding;
            myChart.options.scales.y.max = maxValue + padding;

            updateChart(myChart, labels, data);
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
}

document.getElementById('month').addEventListener('click', () => handleButtonClick('month'));
document.getElementById('year').addEventListener('click', () => handleButtonClick('year'));
document.getElementById('alltime').addEventListener('click', () => handleButtonClick('alltime'));

function handleButtonClick(period) {
    fetchDataAndUpdateChart(period);
    ['month', 'year', 'alltime'].forEach(id => {
        const element = document.getElementById(id);
        if (id === period) {
            element.classList.add('is-active');
        } else {
            element.classList.remove('is-active');
        }
    });
}

function updateIndicatorAndPerformance(data) {
    const todayPriceElement = document.getElementById('today-price');
    const performanceElement = document.getElementById('performance');

    const todayPrice = data[data.length - 1];
    const firstPrice = data[0];
    const performance = ((todayPrice - firstPrice) / firstPrice) * 100;

    todayPriceElement.textContent = `${todayPrice.toFixed(2)}€`;
    performanceElement.textContent = `${performance.toFixed(2)}%`;

    updateIndicatorClass(performance);
}

function updateIndicatorClass(performance) {
    const indicatorElement = document.getElementById('indicator');
    indicatorElement.classList.remove('is-neutral', 'is-negative');
    if (Math.abs(performance) < 2) {
        indicatorElement.classList.add('is-neutral');
    } else if (performance < 0) {
        indicatorElement.classList.add('is-negative');
    }
}

// On window load
window.onload = function() {
    handleButtonClick('alltime');
};

function calculateAndDisplayMinMaxValues(data) {
    const baseValue = 100;
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const maxPercentage = ((maxValue - baseValue) / baseValue) * 100;
    const minPercentage = ((minValue - baseValue) / baseValue) * 100;

    document.getElementById('max').textContent = `${maxPercentage.toFixed(2)}%`;
    document.getElementById('min').textContent = `${minPercentage.toFixed(2)}%`;
}

function updateChart(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();

    updateIndicatorAndPerformance(data);
    calculateAndDisplayMinMaxValues(data);
}

document.getElementById('month').addEventListener('click', () => handleButtonClick('month'));
document.getElementById('year').addEventListener('click', () => handleButtonClick('year'));
document.getElementById('alltime').addEventListener('click', () => handleButtonClick('alltime'));