"""
CPU-intensive workloads:
  - Prime sieve (Sieve of Eratosthenes)
  - Recursive Fibonacci (no memoization — intentional CPU burn)
  - Quicksort on a shuffled large list
"""
from __future__ import annotations

import random
import time
from typing import Callable
from utils.logger import get_logger

logger = get_logger("simulation.cpu")


def sieve_of_eratosthenes(limit: int) -> list[int]:
    is_prime = bytearray([1]) * (limit + 1)
    is_prime[0] = is_prime[1] = 0
    for i in range(2, int(limit**0.5) + 1):
        if is_prime[i]:
            is_prime[i * i :: i] = bytearray(len(is_prime[i * i :: i]))
    return [i for i, v in enumerate(is_prime) if v]


def run_prime_sieve(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
):
    limit_base = 100_000
    limit = limit_base * intensity
    logger.info(f"Prime sieve starting: limit={limit}, duration={duration_s}s")
    emit("started", {"algorithm": "prime_sieve", "limit": limit})

    start = time.monotonic()
    iterations = 0
    while time.monotonic() - start < duration_s:
        primes = sieve_of_eratosthenes(limit)
        iterations += 1
        elapsed = round(time.monotonic() - start, 2)
        emit(
            "progress",
            {
                "iteration": iterations,
                "primes_found": len(primes),
                "elapsed_s": elapsed,
            },
        )

    emit("completed", {"iterations": iterations, "elapsed_s": round(time.monotonic() - start, 2)})
    logger.info(f"Prime sieve completed: {iterations} iterations")


def _fib(n: int) -> int:
    if n <= 1:
        return n
    return _fib(n - 1) + _fib(n - 2)


def run_fibonacci(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
):
    n_base = 28
    n = min(n_base + intensity, 36)
    logger.info(f"Fibonacci starting: n={n}, duration={duration_s}s")
    emit("started", {"algorithm": "fibonacci", "n": n})

    start = time.monotonic()
    iterations = 0
    while time.monotonic() - start < duration_s:
        result = _fib(n)
        iterations += 1
        elapsed = round(time.monotonic() - start, 2)
        emit("progress", {"iteration": iterations, "fib_result": result, "elapsed_s": elapsed})

    emit("completed", {"iterations": iterations, "elapsed_s": round(time.monotonic() - start, 2)})
    logger.info(f"Fibonacci completed: {iterations} iterations, fib({n})={_fib(n)}")


def _quicksort(arr: list) -> list:
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return _quicksort(left) + middle + _quicksort(right)


def run_sort(
    intensity: int,
    duration_s: float,
    emit: Callable[[str, dict], None],
):
    size = 10_000 * intensity
    logger.info(f"Quicksort starting: array_size={size}, duration={duration_s}s")
    emit("started", {"algorithm": "quicksort", "array_size": size})

    start = time.monotonic()
    iterations = 0
    while time.monotonic() - start < duration_s:
        data = random.sample(range(size * 2), size)
        _quicksort(data)
        iterations += 1
        elapsed = round(time.monotonic() - start, 2)
        emit("progress", {"iteration": iterations, "array_size": size, "elapsed_s": elapsed})

    emit("completed", {"iterations": iterations, "elapsed_s": round(time.monotonic() - start, 2)})
    logger.info(f"Quicksort completed: {iterations} iterations")
