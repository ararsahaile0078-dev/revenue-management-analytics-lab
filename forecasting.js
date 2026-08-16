document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       FORECASTING LAB — COMPLETE KPI ENGINE
       ========================================================= */

    const $ = (id) => document.getElementById(id);

    /* =========================================================
       ELEMENT HELPERS
       ========================================================= */

    function firstExisting(ids) {
        for (const id of ids) {
            const el = $(id);
            if (el) return el;
        }
        return null;
    }

    function setText(ids, value) {
        const el = firstExisting(ids);
        if (el) el.textContent = value;
    }

    function getNumber(ids, fallback) {
        const el = firstExisting(ids);

        if (!el) return fallback;

        const value = parseFloat(el.value);

        return Number.isFinite(value) ? value : fallback;
    }

    function getSelectValue(ids, fallback) {
        const el = firstExisting(ids);

        if (!el) return fallback;

        return el.value || fallback;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function round(value, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    function percent(value, decimals = 0) {
        return `${round(value, decimals)}%`;
    }

    function money(value) {
        return `$${Math.round(value).toLocaleString()}`;
    }

    /* =========================================================
       HISTORICAL DEMAND
       ========================================================= */

    const historicalDemand = [
        84, 88, 91, 93, 90, 96, 98, 95,
        101, 104, 102, 107, 109, 111, 108,
        115, 112, 118, 121, 123, 120, 126,
        129, 126, 132, 134, 131, 138, 142,
        140, 133, 127, 119, 110, 104, 98,
        91, 84, 76, 69, 64, 60
    ];

    /* =========================================================
       DEFAULT SCENARIO
       ========================================================= */

    const defaults = {
        capacity: 180,
        demand: 100,
        volatility: 12,
        trend: 4
    };

    /* =========================================================
       FORECAST METHODS
       ========================================================= */

    function naiveForecast(data) {
        return data[data.length - 1];
    }

    function movingAverage(data, window = 5) {
        const start = Math.max(0, data.length - window);

        const values = data.slice(start);

        const total = values.reduce(
            (sum, value) => sum + value,
            0
        );

        return total / values.length;
    }

    function weightedMovingAverage(data) {
        const values = data.slice(-4);

        if (values.length === 0) {
            return 0;
        }

        let weightedTotal = 0;
        let weightTotal = 0;

        values.forEach((value, index) => {
            const weight = index + 1;

            weightedTotal += value * weight;
            weightTotal += weight;
        });

        return weightedTotal / weightTotal;
    }

    function exponentialSmoothing(data, alpha = 0.35) {

        if (!data.length) {
            return 0;
        }

        let forecast = data[0];

        for (let i = 1; i < data.length; i++) {
            forecast =
                alpha * data[i] +
                (1 - alpha) * forecast;
        }

        return forecast;
    }

    function trendForecast(data, trend) {

        const base = movingAverage(data, 5);

        return base * (1 + trend / 100);
    }

    /* =========================================================
       METHOD SELECTOR
       ========================================================= */

    function calculateBaseForecast(method, data, trend) {

        switch (method.toLowerCase()) {

            case "naive":
                return naiveForecast(data);

            case "moving average":
            case "moving_average":
            case "moving-average":
                return movingAverage(data, 5);

            case "weighted moving average":
            case "weighted_moving_average":
            case "weighted":
                return weightedMovingAverage(data);

            case "exponential smoothing":
            case "exponential_smoothing":
            case "exponential":
                return exponentialSmoothing(data);

            case "trend":
            case "trend adjusted":
            case "trend-adjusted":
                return trendForecast(data, trend);

            default:
                return naiveForecast(data);
        }
    }

    /* =========================================================
       COMMERCIAL FORECAST ADJUSTMENT
       ========================================================= */

    function calculateForecast({
        method,
        demand,
        volatility,
        trend
    }) {

        let baseForecast =
            calculateBaseForecast(
                method,
                historicalDemand,
                trend
            );

        /*
         * Demand level acts as the commercial scale.
         *
         * 100 = neutral
         * below 100 = weaker demand
         * above 100 = stronger demand
         */

        const demandFactor = demand / 100;

        /*
         * Trend adjustment
         */

        const trendFactor =
            1 + (trend / 100);

        /*
         * Volatility slightly reduces confidence
         * rather than artificially creating demand.
         */

        const volatilityAdjustment =
            1 - ((volatility - 10) / 1000);

        let forecast =
            baseForecast *
            demandFactor *
            trendFactor *
            volatilityAdjustment;

        return Math.max(0, forecast);
    }

    /* =========================================================
       KPI CALCULATIONS
       ========================================================= */

    function calculateKPIs(
        forecast,
        capacity,
        demand,
        volatility
    ) {

        /* -----------------------------------------
           Load Factor
           ----------------------------------------- */

        const loadFactor =
            capacity > 0
                ? (forecast / capacity) * 100
                : 0;

        /* -----------------------------------------
           MAPE
           ----------------------------------------- */

        const actual =
            historicalDemand[
                historicalDemand.length - 1
            ];

        const mape =
            actual > 0
                ? Math.abs(
                    (actual - forecast) / actual
                ) * 100
                : 0;

        /* -----------------------------------------
           Revenue assumptions
           ----------------------------------------- */

        const averageFare = 185;

        const expectedPassengers =
            Math.min(forecast, capacity);

        const passengerRevenue =
            expectedPassengers * averageFare;

        /* -----------------------------------------
           Ancillary revenue
           ----------------------------------------- */

        const ancillaryPerPassenger = 32;

        const ancillaryRevenue =
            expectedPassengers *
            ancillaryPerPassenger;

        /* -----------------------------------------
           Total revenue
           ----------------------------------------- */

        const totalRevenue =
            passengerRevenue +
            ancillaryRevenue;

        /* -----------------------------------------
           Variable cost
           ----------------------------------------- */

        const variableCostPerPassenger = 82;

        const variableCost =
            expectedPassengers *
            variableCostPerPassenger;

        /* -----------------------------------------
           Fixed flight cost
           ----------------------------------------- */

        const fixedFlightCost = 9500;

        /* -----------------------------------------
           Total cost
           ----------------------------------------- */

        const totalCost =
            variableCost +
            fixedFlightCost;

        /* -----------------------------------------
           Profit
           ----------------------------------------- */

        const profit =
            totalRevenue - totalCost;

        /* -----------------------------------------
           Profit margin
           ----------------------------------------- */

        const profitMargin =
            totalRevenue > 0
                ? (profit / totalRevenue) * 100
                : 0;

        /* -----------------------------------------
           Revenue per available seat
           ----------------------------------------- */

        const RASM =
            capacity > 0
                ? totalRevenue / capacity
                : 0;

        /* -----------------------------------------
           Revenue per passenger
           ----------------------------------------- */

        const yieldPerPassenger =
            expectedPassengers > 0
                ? totalRevenue / expectedPassengers
                : 0;

        /* -----------------------------------------
           Break-even passengers
           ----------------------------------------- */

        const contributionPerPassenger =
            averageFare +
            ancillaryPerPassenger -
            variableCostPerPassenger;

        const breakEvenPassengers =
            contributionPerPassenger > 0
                ? fixedFlightCost /
                  contributionPerPassenger
                : 0;

        /* -----------------------------------------
           Break-even load factor
           ----------------------------------------- */

        const breakEvenLoadFactor =
            capacity > 0
                ? (breakEvenPassengers / capacity) * 100
                : 0;

        /* -----------------------------------------
           Capacity utilization gap
           ----------------------------------------- */

        const unusedCapacity =
            Math.max(0, capacity - forecast);

        /* -----------------------------------------
           Forecast confidence
           ----------------------------------------- */

        const confidence =
            clamp(
                100 -
                Math.abs(mape) -
                volatility * 0.8,
                0,
                100
            );

        return {
            forecast,
            loadFactor,
            mape,
            passengerRevenue,
            ancillaryRevenue,
            totalRevenue,
            variableCost,
            fixedFlightCost,
            totalCost,
            profit,
            profitMargin,
            RASM,
            yieldPerPassenger,
            breakEvenPassengers,
            breakEvenLoadFactor,
            unusedCapacity,
            confidence,
            expectedPassengers
        };
    }

    /* =========================================================
       COMMERCIAL SIGNAL
       ========================================================= */

    function commercialSignal(
        profit,
        loadFactor,
        breakEvenLoadFactor,
        forecast
    ) {

        if (profit < 0) {
            return "Protect margin";
        }

        if (loadFactor < breakEvenLoadFactor) {
            return "Stimulate";
        }

        if (loadFactor >= 90) {
            return "Optimize price";
        }

        if (loadFactor >= 80) {
            return "Strong demand";
        }

        if (forecast < 90) {
            return "Stimulate";
        }

        return "Balance";
    }

    /* =========================================================
       UPDATE KPI CARDS
       ========================================================= */

    function updateKPIs(kpis) {

        /* Existing KPI cards */

        setText(
            ["forecastMetric", "forecastDemand"],
            `${Math.round(kpis.forecast)} pax`
        );

        setText(
            ["mapeMetric", "accuracyMetric"],
            percent(kpis.mape, 1)
        );

        setText(
            ["loadMetric", "loadFactorMetric"],
            percent(kpis.loadFactor, 0)
        );

        setText(
            ["signalMetric", "commercialMetric"],
            commercialSignal(
                kpis.profit,
                kpis.loadFactor,
                kpis.breakEvenLoadFactor,
                kpis.forecast
            )
        );

        /* New commercial KPIs */

        setText(
            ["profitMetric", "profitabilityMetric"],
            money(kpis.profit)
        );

        setText(
            ["marginMetric", "profitMarginMetric"],
            percent(kpis.profitMargin, 1)
        );

        setText(
            ["revenueMetric", "totalRevenueMetric"],
            money(kpis.totalRevenue)
        );

        setText(
            ["costMetric", "totalCostMetric"],
            money(kpis.totalCost)
        );

        setText(
            ["rasmMetric", "rasm"],
            `$${round(kpis.RASM, 2)}`
        );

        setText(
            ["yieldMetric", "yield"],
            `$${round(kpis.yieldPerPassenger, 2)}`
        );

        setText(
            ["breakEvenMetric", "breakEven"],
            `${Math.round(kpis.breakEvenPassengers)} pax`
        );

        setText(
            ["breakEvenLoadMetric", "breakEvenLoad"],
            percent(kpis.breakEvenLoadFactor, 0)
        );

        setText(
            ["capacityGapMetric", "unusedCapacity"],
            `${Math.round(kpis.unusedCapacity)} seats`
        );

        setText(
            ["confidenceMetric", "forecastConfidence"],
            percent(kpis.confidence, 0)
        );
    }

    /* =========================================================
       UPDATE DETAIL OUTPUTS
       ========================================================= */

    function updateDetails(kpis) {

        const detailMap = {

            forecastDetail:
                `${Math.round(kpis.forecast)} passengers expected`,

            revenueDetail:
                money(kpis.totalRevenue),

            costDetail:
                money(kpis.totalCost),

            profitDetail:
                money(kpis.profit),

            marginDetail:
                percent(kpis.profitMargin, 1),

            breakEvenDetail:
                `${Math.round(kpis.breakEvenPassengers)} passengers`,

            loadDetail:
                percent(kpis.loadFactor, 0),

            rasmDetail:
                `$${round(kpis.RASM, 2)}`,

            yieldDetail:
                `$${round(kpis.yieldPerPassenger, 2)}`,

            confidenceDetail:
                percent(kpis.confidence, 0)
        };

        Object.keys(detailMap).forEach(id => {

            const el = $(id);

            if (el) {
                el.textContent = detailMap[id];
            }
        });
    }

    /* =========================================================
       UPDATE CHART
       ========================================================= */

    function updateChart(
        forecast,
        capacity
    ) {

        /*
         * If the page has a canvas, draw the forecast chart.
         * This does not interfere with the existing chart
         * if another chart system is already being used.
         */

        const canvas =
            firstExisting([
                "forecastChart",
                "demandChart",
                "chart"
            ]);

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const width =
            canvas.width =
                canvas.clientWidth * 2;

        const height =
            canvas.height =
                canvas.clientHeight * 2;

        ctx.clearRect(0, 0, width, height);

        const padding = 60;

        const values =
            historicalDemand.concat([
                forecast
            ]);

        const maxValue =
            Math.max(
                ...values,
                capacity
            ) * 1.15;

        const minValue =
            Math.min(
                ...values
            ) * 0.75;

        const range =
            maxValue - minValue || 1;

        const xStep =
            (width - padding * 2) /
            Math.max(1, values.length - 1);

        function y(value) {

            return height -
                padding -
                (
                    (value - minValue) /
                    range
                ) *
                (height - padding * 2);
        }

        /* Grid */

        ctx.strokeStyle = "#26384b";
        ctx.lineWidth = 2;

        for (let i = 0; i < 5; i++) {

            const gridY =
                padding +
                (
                    i / 4
                ) *
                (
                    height - padding * 2
                );

            ctx.beginPath();

            ctx.moveTo(
                padding,
                gridY
            );

            ctx.lineTo(
                width - padding,
                gridY
            );

            ctx.stroke();
        }

        /* Historical line */

        ctx.beginPath();

        historicalDemand.forEach(
            (value, index) => {

                const x =
                    padding +
                    index * xStep;

                const pointY =
                    y(value);

                if (index === 0) {
                    ctx.moveTo(
                        x,
                        pointY
                    );
                } else {
                    ctx.lineTo(
                        x,
                        pointY
                    );
                }
            }
        );

        ctx.strokeStyle = "#8fb9df";
        ctx.lineWidth = 5;
        ctx.stroke();

        /* Forecast line */

        const forecastStart =
            historicalDemand.length - 1;

        ctx.beginPath();

        const startX =
            padding +
            forecastStart * xStep;

        ctx.moveTo(
            startX,
            y(
                historicalDemand[
                    historicalDemand.length - 1
                ]
            )
        );

        ctx.lineTo(
            padding +
            (values.length - 1) * xStep,
            y(forecast)
        );

        ctx.strokeStyle = "#f6a54f";
        ctx.lineWidth = 6;
        ctx.stroke();

        /* Capacity line */

        ctx.beginPath();

        ctx.setLineDash([
            12,
            10
        ]);

        ctx.moveTo(
            padding,
            y(capacity)
        );

        ctx.lineTo(
            width - padding,
            y(capacity)
        );

        ctx.strokeStyle = "#75c69b";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.setLineDash([]);

    }

    /* =========================================================
       MAIN CALCULATION
       ========================================================= */

    function runForecast() {

        const method =
            getSelectValue(
                ["forecastMethod", "methodSelect"],
                "Naive"
            );

        const capacity =
            getNumber(
                [
                    "capacity",
                    "aircraftCapacity",
                    "capacityInput"
                ],
                defaults.capacity
            );

        const demand =
            getNumber(
                [
                    "demand",
                    "baseDemand",
                    "demandLevel",
                    "demandInput"
                ],
                defaults.demand
            );

        const volatility =
            getNumber(
                [
                    "volatility",
                    "demandVolatility",
                    "volatilityInput"
                ],
                defaults.volatility
            );

        const trend =
            getNumber(
                [
                    "trend",
                    "demandTrend",
                    "trendInput"
                ],
                defaults.trend
            );

        const forecast =
            calculateForecast({
                method,
                demand,
                volatility,
                trend
            });

        const kpis =
            calculateKPIs(
                forecast,
                capacity,
                demand,
                volatility
            );

        updateKPIs(kpis);

        updateDetails(kpis);

        updateChart(
            forecast,
            capacity
        );

        /* Forecast title */

        setText(
            [
                "forecastTitle",
                "forecastMethodLabel"
            ],
            `${method} forecast · ${Math.round(forecast)} pax`
        );

        /* Forecast output */

        setText(
            [
                "forecastOutput",
                "forecastResult"
            ],
            `${Math.round(forecast)} pax`
        );

        /* Store results */

        window.forecastingResults = kpis;

        return kpis;
    }

    /* =========================================================
       CONNECT FORM
       ========================================================= */

    const form =
        firstExisting([
            "forecastForm"
        ]);

    if (form) {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                runForecast();
            }
        );
    }

    /* =========================================================
       RUN FORECAST BUTTON
       ========================================================= */

    const runButton =
        firstExisting([
            "runForecast",
            "runForecastBtn",
            "forecastButton"
        ]);

    if (runButton) {

        runButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                runForecast();
            }
        );
    }

    /* =========================================================
       LIVE SLIDER UPDATES
       ========================================================= */

    const controlIds = [
        "capacity",
        "aircraftCapacity",
        "capacityInput",

        "demand",
        "baseDemand",
        "demandLevel",
        "demandInput",

        "volatility",
        "demandVolatility",
        "volatilityInput",

        "trend",
        "demandTrend",
        "trendInput"
    ];

    controlIds.forEach(id => {

        const el = $(id);

        if (!el) return;

        el.addEventListener(
            "input",
            () => {

                /*
                 * Update visible slider value if an
                 * associated value element exists.
                 */

                const valueElement =
                    firstExisting([
                        `${id}Value`,
                        `${id}Output`,
                        `${id}Label`
                    ]);

                if (valueElement) {

                    let value =
                        parseFloat(el.value);

                    if (
                        id.includes("volatility")
                    ) {
                        valueElement.textContent =
                            `${value}%`;
                    }

                    else if (
                        id.includes("trend")
                    ) {
                        valueElement.textContent =
                            `${value >= 0 ? "+" : ""}${value}%`;
                    }

                    else {
                        valueElement.textContent =
                            Math.round(value);
                    }
                }

                runForecast();
            }
        );

        el.addEventListener(
            "change",
            runForecast
        );
    });

    /* =========================================================
       METHOD CHANGE
       ========================================================= */

    const methodSelect =
        firstExisting([
            "forecastMethod",
            "methodSelect"
        ]);

    if (methodSelect) {

        methodSelect.addEventListener(
            "change",
            runForecast
        );
    }

    /* =========================================================
       INITIAL RUN
       ========================================================= */

    runForecast();

});
