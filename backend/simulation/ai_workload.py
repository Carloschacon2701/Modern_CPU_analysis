"""
AI/ML workloads (Innovation module) — numpy-only, no ML framework required.

Three algorithms:
1. Matrix Multiplication: randomized float32 matrix multiply benchmark
2. K-Means Clustering: Lloyd's algorithm on synthetic 2D dataset
3. Neural Network (mini): single-layer perceptron trained on XOR with gradient descent

All emit per-iteration progress events for live convergence visualization.
"""
from __future__ import annotations

import time
from typing import Callable

import numpy as np

from utils.logger import get_logger

logger = get_logger("simulation.ai")


# ── 1. Matrix Multiplication ─────────────────────────────────────────────────

def run_matrix_multiply(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
):
    size = 128 * intensity
    logger.info(f"Matrix multiply starting: size={size}x{size}, duration={duration_s}s")
    emit("started", {"algorithm": "matrix_multiply", "matrix_size": size})

    start = time.monotonic()
    iterations = 0
    total_flops = 0

    while time.monotonic() - start < duration_s:
        A = np.random.rand(size, size).astype(np.float32)
        B = np.random.rand(size, size).astype(np.float32)
        C = A @ B
        flops = 2 * size**3
        total_flops += flops
        iterations += 1
        elapsed = time.monotonic() - start
        gflops = total_flops / elapsed / 1e9
        emit(
            "progress",
            {
                "iteration": iterations,
                "matrix_size": size,
                "gflops": round(gflops, 4),
                "elapsed_s": round(elapsed, 2),
            },
        )
        _ = C  # prevent optimization

    emit(
        "completed",
        {
            "iterations": iterations,
            "total_gflops": round(total_flops / 1e9, 4),
            "elapsed_s": round(time.monotonic() - start, 2),
        },
    )
    logger.info(f"Matrix multiply completed: {iterations} iterations")


# ── 2. K-Means Clustering ────────────────────────────────────────────────────

def _kmeans_step(X: np.ndarray, centroids: np.ndarray) -> tuple[np.ndarray, np.ndarray, float]:
    """One Lloyd's iteration: assign + update."""
    dists = np.linalg.norm(X[:, np.newaxis] - centroids[np.newaxis, :], axis=2)
    labels = np.argmin(dists, axis=1)
    new_centroids = np.array(
        [X[labels == k].mean(axis=0) if (labels == k).any() else centroids[k]
         for k in range(len(centroids))]
    )
    inertia = float(np.sum(np.min(dists, axis=1) ** 2))
    return new_centroids, labels, inertia


def run_kmeans(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
):
    n_points = 2000 * intensity
    k = 5 + intensity // 2
    logger.info(f"K-means starting: n_points={n_points}, k={k}, duration={duration_s}s")
    emit("started", {"algorithm": "kmeans", "n_points": n_points, "k": k})

    np.random.seed(42)
    # Generate clustered data
    centers = np.random.rand(k, 2) * 10
    X = np.vstack(
        [centers[i] + np.random.randn(n_points // k, 2) * 0.8 for i in range(k)]
    )

    start = time.monotonic()
    runs = 0

    while time.monotonic() - start < duration_s:
        centroids = X[np.random.choice(len(X), k, replace=False)]
        prev_inertia = float("inf")

        for iteration in range(100):
            centroids, labels, inertia = _kmeans_step(X, centroids)
            delta = abs(prev_inertia - inertia)
            prev_inertia = inertia

            if iteration % 10 == 0:
                elapsed = round(time.monotonic() - start, 2)
                emit(
                    "progress",
                    {
                        "run": runs + 1,
                        "iteration": iteration,
                        "inertia": round(inertia, 4),
                        "delta": round(delta, 6),
                        "elapsed_s": elapsed,
                    },
                )

            if delta < 1e-4:
                break

        runs += 1

    emit(
        "completed",
        {"runs": runs, "final_inertia": round(prev_inertia, 4), "elapsed_s": round(time.monotonic() - start, 2)},
    )
    logger.info(f"K-means completed: {runs} runs")


# ── 3. Mini Neural Network (XOR) ─────────────────────────────────────────────

def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))


def _sigmoid_deriv(s: np.ndarray) -> np.ndarray:
    return s * (1.0 - s)


def run_neural_network(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
):
    hidden = 8 + intensity * 2
    epochs_per_run = 1000 * intensity
    lr = 0.1

    logger.info(
        f"Neural network starting: hidden={hidden}, epochs_per_run={epochs_per_run}, duration={duration_s}s"
    )
    emit(
        "started",
        {
            "algorithm": "neural_network",
            "architecture": f"2→{hidden}→1",
            "activation": "sigmoid",
            "loss": "MSE",
            "learning_rate": lr,
        },
    )

    # XOR dataset
    X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=np.float32)
    y = np.array([[0], [1], [1], [0]], dtype=np.float32)

    start = time.monotonic()
    runs = 0

    while time.monotonic() - start < duration_s:
        np.random.seed(runs)
        W1 = np.random.randn(2, hidden).astype(np.float32) * 0.5
        b1 = np.zeros((1, hidden), dtype=np.float32)
        W2 = np.random.randn(hidden, 1).astype(np.float32) * 0.5
        b2 = np.zeros((1, 1), dtype=np.float32)
        final_loss = 1.0

        for epoch in range(epochs_per_run):
            # Forward pass
            z1 = X @ W1 + b1
            a1 = _sigmoid(z1)
            z2 = a1 @ W2 + b2
            a2 = _sigmoid(z2)

            loss = float(np.mean((a2 - y) ** 2))

            # Backward pass
            d_a2 = (a2 - y) * _sigmoid_deriv(a2) / len(X)
            d_W2 = a1.T @ d_a2
            d_b2 = d_a2.sum(axis=0, keepdims=True)
            d_a1 = d_a2 @ W2.T * _sigmoid_deriv(a1)
            d_W1 = X.T @ d_a1
            d_b1 = d_a1.sum(axis=0, keepdims=True)

            W2 -= lr * d_W2
            b2 -= lr * d_b2
            W1 -= lr * d_W1
            b1 -= lr * d_b1
            final_loss = loss

            if epoch % 100 == 0:
                elapsed = round(time.monotonic() - start, 2)
                emit(
                    "progress",
                    {
                        "run": runs + 1,
                        "epoch": epoch,
                        "loss": round(loss, 6),
                        "elapsed_s": elapsed,
                    },
                )

        runs += 1

    emit(
        "completed",
        {
            "runs": runs,
            "final_loss": round(final_loss, 6),
            "elapsed_s": round(time.monotonic() - start, 2),
        },
    )
    logger.info(f"Neural network completed: {runs} runs, final_loss={final_loss:.6f}")
