/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function NeuralGlobe() {
  return (
    <div className="absolute inset-0 -z-10 bg-[#020617] overflow-hidden">
      {/* Статичний градієнт замість WebGL для більшої стабільності */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,#00D4FF,transparent_70%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/20 via-transparent to-[#020617] pointer-events-none" />
    </div>
  );
}
