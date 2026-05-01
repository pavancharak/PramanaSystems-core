import {
  describe,
  expect,
  test,
} from "vitest";

import {
  evaluatePolicy,
} from "@pramanasystems/execution";

describe(
  "deterministic evaluator",
  () => {
    test(
      "same signals produce same decision",
      () => {
        const signals = {
          insurance_active:
            true,

          risk_score: 42,

          vip_customer:
            false,
        };

        const result1 =
          evaluatePolicy(
            "claims-approval",
            "v1",
            signals
          );

        const result2 =
          evaluatePolicy(
            "claims-approval",
            "v1",
            signals
          );

        expect(result1)
          .toBe("approve");

        expect(result2)
          .toBe("approve");

        expect(result1)
          .toBe(result2);
      }
    );

    test(
      "failed condition denies decision",
      () => {
        const signals = {
          insurance_active:
            false,

          risk_score: 42,

          vip_customer:
            false,
        };

        const result =
          evaluatePolicy(
            "claims-approval",
            "v1",
            signals
          );

        expect(result)
          .toBe("deny");
      }
    );

    test(
      "numeric threshold evaluation works",
      () => {
        const approved =
          evaluatePolicy(
            "claims-approval",
            "v1",
            {
              insurance_active:
                true,

              risk_score: 42,

              vip_customer:
                false,
            }
          );

        expect(approved)
          .toBe("approve");

        const denied =
          evaluatePolicy(
            "claims-approval",
            "v1",
            {
              insurance_active:
                true,

              risk_score: 95,

              vip_customer:
                false,
            }
          );

        expect(denied)
          .toBe("deny");
      }
    );

    test(
      "vip override bypasses risk threshold",
      () => {
        const result =
          evaluatePolicy(
            "claims-approval",
            "v1",
            {
              insurance_active:
                true,

              risk_score: 95,

              vip_customer:
                true,
            }
          );

        expect(result)
          .toBe("approve");
      }
    );

    test(
      "missing required signal fails",
      () => {
        expect(() =>
          evaluatePolicy(
            "claims-approval",
            "v1",
            {
              insurance_active:
                true,
            }
          )
        ).toThrow(
          "Missing required signal"
        );
      }
    );

    test(
      "invalid signal type fails",
      () => {
        expect(() =>
          evaluatePolicy(
            "claims-approval",
            "v1",
            {
              insurance_active:
                true,

              risk_score:
                "high",

              vip_customer:
                false,
            }
          )
        ).toThrow(
          "Invalid signal type"
        );
      }
    );

    test(
      "unsupported schema version fails",
      () => {
        expect(() =>
          evaluatePolicy(
            "claims-approval",
            "v999",
            {
              insurance_active:
                true,

              risk_score: 42,

              vip_customer:
                false,
            }
          )
        ).toThrow();
      }
    );
  }
);


