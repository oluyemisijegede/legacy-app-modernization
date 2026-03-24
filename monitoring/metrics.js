const client = require("prom-client");

module.exports = function(app) {

const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics();

const httpRequestCounter = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests"
});

app.use((req, res, next) => {
    httpRequestCounter.inc();
    next();
});

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
});

};