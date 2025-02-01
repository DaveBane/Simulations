import { runSimulation } from '../server/simulate';

export default function handler(req, res) {
  const spheres = runSimulation();
  res.status(200).json(spheres);
}
