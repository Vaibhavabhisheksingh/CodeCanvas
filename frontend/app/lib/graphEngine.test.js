import test from "node:test";
import assert from "node:assert/strict";
import { calculateQueueingMetrics } from "./graphEngine.js";

import {
  buildGraph,
  topologicalSort,
  validateArchitecture,
  propagateTraffic
} from "./graphEngine.js";
import { calculateUtilization } from "./graphEngine.js";


test("builds an adjacency list", () => {
  const nodes = [{ id: "client" }, { id: "server" }, { id: "db" }];

  const edges = [
    { source: "client", target: "server" },
    { source: "server", target: "db" },
  ];

  const graph = buildGraph(nodes, edges);

  assert.deepEqual(graph.adjacencyList, {
    client: ["server"],
    server: ["db"],
    db: [],
  });
});

test("rejects cycles", () => {
  const nodes = [{ id: "a" }, { id: "b" }];

  const adjacencyList = {
    a: ["b"],
    b: ["a"],
  };

  assert.throws(
    () => topologicalSort(nodes, adjacencyList),
    /contains a cycle/,
  );
});

test("detects invalid connections", () => {
  assert.throws(
    () =>
      buildGraph([{ id: "client" }], [{ source: "client", target: "missing" }]),
    /Invalid connection/,
  );
});

test("rejects an architecture without a database", () => {
  const nodes = [
    {
      id: "client",
      type: "client",
      data: { label: "Client", capacity: 1000, servers: 1 },
    },
    {
      id: "server",
      type: "server",
      data: { label: "Server", capacity: 1000, servers: 1 },
    },
  ];

  const edges = [{ source: "client", target: "server" }];

  const result = validateArchitecture(nodes, edges);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("Database")));
});

test("propagates traffic through a simple architecture", () => {
  const nodes = [
    {
      id: "client-1",
      type: "client",
      data: { label: "Client", capacity: 20000, servers: 1 },
    },
    {
      id: "server-1",
      type: "server",
      data: { label: "Server", capacity: 10000, servers: 1 },
    },
    {
      id: "database-1",
      type: "database",
      data: { label: "Database", capacity: 10000, servers: 1 },
    },
  ];

  const edges = [
    {
      id: "edge-1",
      source: "client-1",
      target: "server-1",
    },
    {
      id: "edge-2",
      source: "server-1",
      target: "database-1",
    },
  ];

  const result = propagateTraffic(nodes, edges, 10000);

  assert.equal(result.trafficByNode["client-1"], 10000);
  assert.equal(result.trafficByNode["server-1"], 10000);
  assert.equal(result.trafficByNode["database-1"], 10000);

  assert.equal(result.trafficByEdge["client-1->server-1"], 10000);
  assert.equal(result.trafficByEdge["server-1->database-1"], 10000);

  assert.equal(result.totalIncomingTraffic, 10000);
});

test("calculates utilization and identifies overloaded components", () => {
  const nodes = [
    {
      id: "server-1",
      type: "server",
      data: {
        label: "Server A",
        capacity: 3000,
        servers: 2,
      },
    },
    {
      id: "database-1",
      type: "database",
      data: {
        label: "Database",
        capacity: 4000,
        servers: 1,
      },
    },
  ];

  const trafficResult = {
    trafficByNode: {
      "server-1": 5000,
      "database-1": 5000,
    },
  };

  const result = calculateUtilization(nodes, trafficResult);

  assert.equal(result.components[0].totalCapacity, 6000);
  assert.equal(result.components[0].utilization, 83.33);
  assert.equal(result.components[0].status, "yellow");

  assert.equal(result.components[1].totalCapacity, 4000);
  assert.equal(result.components[1].utilization, 125);
  assert.equal(result.components[1].status, "red");

  assert.equal(result.hasBottlenecks, true);
  assert.equal(result.bottlenecks.length, 1);
  assert.equal(result.bottlenecks[0].name, "Database");
});

test("calculates M/M/1 waiting and response times", () => {
  const nodes = [
    {
      id: "server-1",
      type: "server",
      data: {
        label: "Server",
        capacity: 10000,
        servers: 1,
      },
    },
  ];

  const trafficResult = {
    trafficByNode: {
      "server-1": 8000,
    },
  };

  const [result] = calculateQueueingMetrics(nodes, trafficResult);

  assert.equal(result.model, "M/M/1");
  assert.equal(result.stable, true);
  assert.equal(result.utilization, 80);

  assert.ok(
    Math.abs(result.averageQueueWaitSeconds - 0.0004) < 1e-10,
  );

  assert.ok(
    Math.abs(result.averageResponseSeconds - 0.0005) < 1e-10,
  );
});

test("calculates stable M/M/c metrics for multiple instances", () => {
  const nodes = [
    {
      id: "server-1",
      type: "server",
      data: {
        label: "Server Cluster",
        capacity: 4000,
        servers: 3,
      },
    },
  ];

  const trafficResult = {
    trafficByNode: {
      "server-1": 8000,
    },
  };

  const [result] = calculateQueueingMetrics(nodes, trafficResult);

  assert.equal(result.model, "M/M/c");
  assert.equal(result.stable, true);
  assert.ok(result.averageQueueWaitSeconds >= 0);
  assert.ok(result.averageResponseSeconds > 0);
});

test("does not report finite waiting time for an unstable queue", () => {
  const nodes = [
    {
      id: "server-1",
      type: "server",
      data: {
        label: "Overloaded Server",
        capacity: 4000,
        servers: 2,
      },
    },
  ];

  const trafficResult = {
    trafficByNode: {
      "server-1": 8000,
    },
  };

  const [result] = calculateQueueingMetrics(nodes, trafficResult);

  assert.equal(result.stable, false);
  assert.equal(result.averageQueueWaitSeconds, null);
  assert.equal(result.averageResponseSeconds, null);
});