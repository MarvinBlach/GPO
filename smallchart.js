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

    function fetchDataAndUpdateAll(period) {
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
        fetchDataAndUpdateAll(period);
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

    function calculateTotalPerformance(data) {
        const firstPrice = data[0];
        const lastPrice = data[data.length - 1];
        return ((lastPrice - firstPrice) / firstPrice) * 100;
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

    function fetchAndDisplayStaticMetrics() {
        const apiUrl = `https://api.extraetf.com/customer-api/ic/detail/?isin=AT0000A2B4T3`;
    
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                console.log('Full API response:', data);
                if (data.results && data.results.length > 0) {
                    const fundData = data.results[0];
                    console.log('Fund data:', fundData);
    
                    if (fundData.returns_nav) {
                        console.log('Returns NAV:', fundData.returns_nav);
                        // Get the first key in the returns_nav object
                        const returnsNavKey = Object.keys(fundData.returns_nav)[0];
                        const returnsNav = fundData.returns_nav[returnsNavKey];
                        console.log(`Returns NAV for ${returnsNavKey}:`, returnsNav);
    
                        if (returnsNav && returnsNav.cumulative_total_return_since_inception !== null) {
                            const totalReturn = returnsNav.cumulative_total_return_since_inception;
                            console.log('Total return since inception:', totalReturn);
                            document.getElementById('allperformance').textContent = 
                                `${totalReturn.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
                        } else {
                            console.log('cumulative_total_return_since_inception is null or undefined');
                            document.getElementById('allperformance').textContent = 'N/A';
                        }
                    } else {
                        console.log('returns_nav is undefined');
                        document.getElementById('allperformance').textContent = 'N/A';
                    }
    
                    // Annualized performance since inception
                    if (fundData.trailing_return_month_end && fundData.trailing_return_month_end.since_inception_pa !== null) {
                        const annualizedReturn = fundData.trailing_return_month_end.since_inception_pa;
                        console.log('Annualized return since inception:', annualizedReturn);
                        document.getElementById('average').textContent = 
                            `${annualizedReturn.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
                    } else {
                        console.log('since_inception_pa is null or undefined');
                        document.getElementById('average').textContent = 'N/A';
                    }
    
                    const riskAndRating = fundData.risk_and_rating && fundData.risk_and_rating['3']; // 3-year data
    
                    // 3-year volatility
                    if (riskAndRating && riskAndRating.volatility !== null) {
                        const volatility = riskAndRating.volatility;
                        console.log('3-year volatility:', volatility);
                        document.getElementById('vola').textContent = 
                            `${volatility.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
                    } else {
                        console.log('volatility is null or undefined');
                        document.getElementById('vola').textContent = 'N/A';
                    }
    
                    // 3-year maximum drawdown
                    if (riskAndRating && riskAndRating.max_drawdown !== null) {
                        const maxDrawdown = Math.abs(riskAndRating.max_drawdown);
                        console.log('3-year max drawdown:', maxDrawdown);
                        document.getElementById('water').textContent = 
                            `${maxDrawdown.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
                    } else {
                        console.log('max_drawdown is null or undefined');
                        document.getElementById('water').textContent = 'N/A';
                    }
                } else {
                    console.error('No fund data found in the API response');
                    setAllMetricsToNA();
                }
            })
            .catch(error => {
                console.error('Error fetching static metrics:', error);
                setAllMetricsToNA();
            });
    }
    
    function setAllMetricsToNA() {
        document.getElementById('allperformance').textContent = 'N/A';
        document.getElementById('average').textContent = 'N/A';
        document.getElementById('vola').textContent = 'N/A';
        document.getElementById('water').textContent = 'N/A';
    }

    // Fetch static metrics once when the page loads
    fetchAndDisplayStaticMetrics();

    // Initial data load for 'alltime'
    handleButtonClick('alltime');
});