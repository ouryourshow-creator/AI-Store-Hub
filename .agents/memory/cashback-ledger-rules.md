---
name: Cashback ledger rules
description: Integrity rules for earning, approving, spending, and cancelling customer cashback.
---

Cashback is a per-currency ledger: confirmed purchases earn 5% as pending credit, only admin approval makes it available, and redemptions must only draw from the available net balance.

**Why:** A later cancellation can invalidate an earned reward. If that reward was already spent, voiding it would leave an unfunded discount and silently hide a negative balance.

**How to apply:** Keep customer/currency balance-changing operations serialized. On cancellation, void pending or available earned rewards and reverse redemption on the same order only when the resulting balance remains non-negative; otherwise refuse cancellation until the spent reward is resolved.