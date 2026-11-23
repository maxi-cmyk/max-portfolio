// Turns each case-study layout into one list of steps, so the case scene and
// the static page walk through any project the same way.
// A step is { title, body, more?, code?, table? }: `more` holds further
// paragraphs, and `table` is { caption, head, rows } with the first column as
// row headers. Layouts: algorithm, lifecycle, event-sequence, pipeline,
// frame-loop. Each layout's own shape also draws its map (components/case-map.js).

const extras = ({ more, code, table }) => ({
  ...(more?.length ? { more } : {}),
  ...(code ? { code } : {}),
  ...(table ? { table } : {}),
});

export function getCaseStudySteps(insights = {}) {
  switch (insights.layout) {
    case "algorithm":
      return (insights.howItWorks?.steps ?? []).map((step) => ({
        title: step.title,
        body: step.body,
        ...extras(step),
      }));
    case "lifecycle":
      return (insights.lifecycle?.steps ?? []).map((step) => ({
        title: step.title,
        body: step.body,
        ...extras(step),
      }));
    case "event-sequence":
      return (insights.eventSequence?.steps ?? []).map((step) => ({
        title: step.title,
        body: step.actorLabel ? `${step.actorLabel}: ${step.body}` : step.body,
        ...extras(step),
      }));
    case "pipeline": {
      const { source, lanes = [], merge } = insights.pipeline ?? {};
      return [
        ...(source
          ? [{ title: source.label, body: source.detail, ...extras(source) }]
          : []),
        ...lanes.map((lane) => ({
          title: lane.label,
          // The lane's own steps are drawn in its map.
          body: lane.detail ?? `${lane.steps.join(" → ")}.`,
          ...extras(lane),
        })),
        ...(merge
          ? [{ title: merge.label, body: merge.detail, ...extras(merge) }]
          : []),
      ];
    }
    case "frame-loop": {
      const { phases = [], after } = insights.frameLoop ?? {};
      return [
        ...phases.map((phase) => ({
          title: phase.label,
          body: phase.detail,
          ...extras(phase),
        })),
        ...(after
          ? [{ title: after.label, body: after.detail, ...extras(after) }]
          : []),
      ];
    }
    default:
      return [];
  }
}

// The case study: an overview first, then the layout's own steps.
export function getCaseStudyView(insights = {}) {
  return [
    ...(insights.summary
      ? [
          {
            title: "Overview",
            body: insights.summary,
            ...extras(insights.overview ?? {}),
          },
        ]
      : []),
    ...getCaseStudySteps(insights),
  ];
}
