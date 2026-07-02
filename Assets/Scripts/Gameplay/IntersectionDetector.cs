using System.Collections.Generic;
using UnityEngine;

namespace Scanline.Gameplay
{
    // Runs once per tap (not per frame), so a linear scan is well within
    // budget for the target counts this genre needs (dozens on screen).
    // If populations ever grow an order of magnitude, bucket targets by Y
    // into a sorted/spatial structure before falling back to a full scan.
    public static class IntersectionDetector
    {
        public static void Evaluate(
            IReadOnlyList<Target> targets,
            float scanlineY,
            float halfPulseWidth,
            List<Target> hitTargetsBuffer,
            List<Target> hitNodesBuffer)
        {
            hitTargetsBuffer.Clear();
            hitNodesBuffer.Clear();

            for (int i = 0; i < targets.Count; i++)
            {
                var target = targets[i];
                float reach = halfPulseWidth + target.CollisionRadius;
                if (Mathf.Abs(target.Position.y - scanlineY) > reach) continue;

                if (target.Kind == TargetKind.ProtectedNode)
                {
                    hitNodesBuffer.Add(target);
                }
                else
                {
                    hitTargetsBuffer.Add(target);
                }
            }
        }
    }
}
