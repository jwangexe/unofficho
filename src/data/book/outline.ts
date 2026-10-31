import type { Chapter } from '../schemas';

/** Chapter titles and the order of their sections. Pages say which section they belong to. */
export const BOOK_OUTLINE: Record<Chapter, { title: string; sections: { id: string; title: string }[] }> = {
  physical: {
    title: 'Physical',
    sections: [
      { id: 'thermodynamics', title: 'Thermodynamics' },
      { id: 'kinetics', title: 'Kinetics' },
      { id: 'equilibrium', title: 'Equilibrium' },
      { id: 'electrochemistry', title: 'Electrochemistry' },
    ],
  },
  inorganic: {
    title: 'Inorganic',
    sections: [
      { id: 'periodic-trends', title: 'Periodic trends' },
      { id: 'redox', title: 'Redox' },
      { id: 'coordination', title: 'Coordination chemistry' },
      { id: 'main-group', title: 'Main-group deduction' },
    ],
  },
  organic: {
    title: 'Organic',
    sections: [
      { id: 'carbonyl', title: 'Carbonyl chemistry' },
      { id: 'substitution-elimination', title: 'Substitution and elimination' },
      { id: 'oxidation-reduction', title: 'Oxidation and reduction' },
      { id: 'protecting-groups', title: 'Protecting groups' },
      { id: 'pericyclic', title: 'Pericyclic basics' },
      { id: 'carbohydrates', title: 'Carbohydrates' },
    ],
  },
  analytical: {
    title: 'Analytical',
    sections: [
      { id: 'titrations', title: 'Titrations' },
      { id: 'ph-curves', title: 'pH curves' },
      { id: 'buffers', title: 'Buffers' },
    ],
  },
};
