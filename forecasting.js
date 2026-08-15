document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forecastForm");
    const dataInput = document.getElementById("historicalData");
    const methodSelect = document.getElementById("forecastMethod");
    const horizonInput = document.getElementById("forecastHorizon");

    const forecastOutput = document.getElementById("forecastOutput");
    const forecastTable = document.getElementById("forecastTable");
    const accuracyOutput = document.getElementById("accuracyOutput");

    if (!form) return;

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const values = dataInput.value
            .split(",")
            .map(Number)
            .filter(value => Number.isFinite(value));

        const horizon = parseInt(horizonInput.value, 10);
        const method = methodSelect.value;

        if (values.length < 3) {
            alert("Please enter at least 3 historical demand values.");
            return;
        }

        if (!horizon || horizon < 1) {
            alert("Please enter a valid forecast horizon.");
            return;
        }

        let forecast;

        if (method === "moving-average") {
            forecast = movingAverage(values, horizon);
        } else if (method === "exponential-smoothing") {
            forecast = exponentialSmoothing(values, horizon);
        } else {
            forecast = linearTrend(values, horizon);
        }

        displayForecast(values, forecast);
        calculateAccuracy(values);
    });

    function movingAverage(values, horizon) {
        const windowSize = Math.min(3, values.length);
        const result = [];
        let working = [...values];

        for (let i = 0; i < horizon; i++) {
            const recent = working.slice(-windowSize);
            const average =
                recent.reduce((sum, value) => sum + value, 0) /
                recent.length;

            result.push(average);
            working.push(average);
        }

        return result;
    }

    function exponentialSmoothing(values, horizon) {
        const alpha = 0.3;
        let level = values[0];

        for (let i = 1; i < values.length; i++) {
            level = alpha * values[i] + (1 - alpha) * level;
        }

        return Array(horizon).fill(level);
    }

    function linearTrend(values, horizon) {
        const n = values.length;

        const xMean = (n - 1) / 2;
        const yMean =
            values.reduce((sum, value) => sum + value, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (i - xMean) * (values[i] - yMean);
            denominator += Math.pow(i - xMean, 2);
        }

        const slope = denominator === 0 ? 0 : numerator / denominator;
        const intercept = yMean - slope * xMean;

        const result = [];

        for (let i = 0; i < horizon; i++) {
            const futureX = n + i;
            result.push(intercept + slope * futureX);
        }

        return result;
    }

    function displayForecast(values, forecast) {
        forecastOutput.innerHTML = `
            <h3>Forecast Results</h3>
            <p>Historical observations: ${values.length}</p>
            <p>Forecast periods: ${forecast.length}</p>
        `;

        forecastTable.innerHTML = `
            <tr>
                <th>Period</th>
                <th>Forecast Demand</th>
            </tr>
        `;

        forecast.forEach((value, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${Math.max(0, value).toFixed(2)}</td>
            `;

            forecastTable.appendChild(row);
        });
    }

    function calculateAccuracy(values) {
        if (values.length < 4) {
            accuracyOutput.innerHTML =
                "Accuracy metrics require at least 4 historical observations.";
            return;
        }

        const training = values.slice(0, -1);
        const actual = values[values.length - 1];

        const predicted =
            training.reduce((sum, value) => sum + value, 0) /
            training.length;

        const error = actual - predicted;

        const absoluteError = Math.abs(error);

        const mape =
            actual === 0
                ? 0
                : (absoluteError / Math.abs(actual)) * 100;

        const rmse = Math.sqrt(Math.pow(error, 2));

        accuracyOutput.innerHTML = `
            <h3>Forecast Accuracy</h3>
            <p><strong>MAPE:</strong> ${mape.toFixed(2)}%</p>
            <p><strong>RMSE:</strong> ${rmse.toFixed(2)}</p>
            <p><strong>Last Actual:</strong> ${actual.toFixed(2)}</p>
            <p><strong>Estimated:</strong> ${predicted.toFixed(2)}</p>
        `;
    }
});
