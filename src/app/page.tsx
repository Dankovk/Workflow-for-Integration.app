
import { createWorkflow } from "@/workflow/actions";
import { mockWorkflow } from "@/workflow/mock";
export const revalidate = 0;
export const dynamic = "force-dynamic";
const workflow = await createWorkflow(mockWorkflow);
const { steps } = await workflow();
export default async function WorkflowPage() {


	return (
		<div className="p-8">
			<h2 className="text-xl font-bold mb-4">Workflow Steps:</h2>
			<div className="space-y-4">
				{steps.map((step) => (
					<div key={step.step.uuid}>
						<h2 className="text-lg font-bold">
							{step.step.id === "step1" ? "Started here" : "Then we went here"}
						</h2>
						<div key={`${step.step.id}`} className="p-4 bg-gray-100 rounded">
							<pre>{JSON.stringify(step, null, 2)}</pre>
						</div>
					</div>
				))}
			</div>

			<h2 className="text-xl font-bold mt-8 mb-4">Final Step:</h2>
			<pre className="p-4 bg-gray-100 rounded">
				{JSON.stringify(steps[steps.length - 1], null, 2)}
			</pre>
		</div>
	);
}

