document.addEventListener('DOMContentLoaded', function() {
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
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
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

        // Update the date range display in German
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
                const labels = apiData.results.nav.map(entry => '');
                const data = apiData.results.nav.map(entry => entry.value);

                // Calculate min and max for dynamic scaling
                const minValue = Math.min(...data);
                const maxValue = Math.max(...data);

                // Adjust the scale to make the chart more sensitive to small changes
                const padding = (maxValue - minValue) * 0.2; // 20% padding for scale
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

    // Initial data load for 'month'
    handleButtonClick('month');
});


document.addEventListener('DOMContentLoaded', function() {
    function fetchData() {
        const apiUrl = `https://api.extraetf.com/customer-api/ic/chart/?isin=AT0000A2B4T3&data_type=nav`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(apiData => {
                const data = apiData.results.nav.map(entry => entry.value);
                calculateAndDisplayMetrics(data);
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }

    function calculateAndDisplayMetrics(data) {
        const totalPerformance = calculateTotalPerformance(data);
        const volatility = calculateVolatility(data);
        const longestTimeUnderwater = calculateMaxDrawdown(data);
        const average = calculateAverageAnnualPerformance(data);

        document.getElementById('allperformance').textContent = `${totalPerformance.toFixed(2)}%`;
        document.getElementById('vola').textContent = `${volatility.toFixed(2)}%`;
        document.getElementById('average').textContent = `${(average * 100).toFixed(2)}%`;
        document.getElementById('water').textContent = `${longestTimeUnderwater} Tage`;
    }

    function calculateTotalPerformance(data) {
        const firstPrice = data[0];
        const lastPrice = data[data.length - 1];
        return ((lastPrice - firstPrice) / firstPrice) * 100;
    }

    function calculateVolatility(data) {
        const minValue = Math.min(...data);
        const maxValue = Math.max(...data);
        const minDiff = Math.abs(100 - minValue);
        const maxDiff = Math.abs(maxValue - 100);
        return Math.max(minDiff, maxDiff);
    }

    function calculateMaxDrawdown(data) {
        let maxVal = data[0];
        let maxDrawdown = 0;

        data.forEach(value => {
            if (value > maxVal) {
                maxVal = value;
            } else {
                let drawdown = maxVal - value;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        });

        return Math.floor(maxDrawdown);
    }

    function calculateAverageAnnualPerformance(data) {
        let initialVal = data[0];
        let finalVal = data[data.length - 1];

        const launchDate = new Date('2019-11-13');
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - launchDate);
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Convert milliseconds to years

        let performance = Math.pow(finalVal / initialVal, 1 / diffYears) - 1;

        return performance;
    }

    // Fetch data on load
    fetchData();
});
