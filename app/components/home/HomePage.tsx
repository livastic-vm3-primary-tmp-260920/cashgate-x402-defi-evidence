import CashgateWorkbench from "./CashgateWorkbench";

/** Human / agent shared workflow. All live reads come from the same
 * constrained Agent-Native backend actions. Never signs or spends.
 */
export default function HomePage() {
  return <div className="min-h-full bg-[#081E29]"><CashgateWorkbench /></div>;
}
