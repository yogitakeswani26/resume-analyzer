/**
 * Skill Roadmap Generation
 * Creates learning paths for missing skills based on job requirements
 */

interface SkillRoadmapItem {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  estimatedWeeks: number;
  resources: string[];
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  targetLevel: 'intermediate' | 'advanced' | 'expert';
}

export function generateSkillRoadmap(
  resumeContent: string,
  missingSkills: string[],
  jobDescription: string
): SkillRoadmapItem[] {
  const roadmap: SkillRoadmapItem[] = [];

  const skillDetails: { [key: string]: SkillRoadmapItem } = {
    'Kubernetes': {
      skill: 'Kubernetes',
      priority: 'high',
      estimatedWeeks: 4,
      resources: ['Linux Academy', 'Kubernetes.io Documentation', 'Udemy Kubernetes Course'],
      currentLevel: 'beginner',
      targetLevel: 'advanced',
    },
    'Docker': {
      skill: 'Docker',
      priority: 'high',
      estimatedWeeks: 2,
      resources: ['Docker Documentation', 'Udemy Docker Course', 'A Cloud Guru'],
      currentLevel: 'beginner',
      targetLevel: 'advanced',
    },
    'AWS': {
      skill: 'AWS',
      priority: 'high',
      estimatedWeeks: 6,
      resources: ['AWS Certification Path', 'A Cloud Guru', 'Linux Academy'],
      currentLevel: 'beginner',
      targetLevel: 'advanced',
    },
    'GraphQL': {
      skill: 'GraphQL',
      priority: 'medium',
      estimatedWeeks: 3,
      resources: ['How to GraphQL', 'Apollo Docs', 'Udemy GraphQL Course'],
      currentLevel: 'beginner',
      targetLevel: 'intermediate',
    },
    'Microservices': {
      skill: 'Microservices',
      priority: 'high',
      estimatedWeeks: 4,
      resources: ['Sam Newman Books', 'Udemy Microservices', 'System Design Resources'],
      currentLevel: 'beginner',
      targetLevel: 'advanced',
    },
  };

  missingSkills.forEach(skill => {
    if (skillDetails[skill]) {
      roadmap.push(skillDetails[skill]);
    } else {
      // Generic skill roadmap
      roadmap.push({
        skill,
        priority: jobDescription.includes(skill) ? 'high' : 'medium',
        estimatedWeeks: 3,
        resources: [`${skill} Official Documentation`, `Udemy ${skill} Course`, 'YouTube Tutorials'],
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
      });
    }
  });

  // Sort by priority and estimated time
  return roadmap.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.estimatedWeeks - b.estimatedWeeks;
  });
}

export function calculateRoadmapTimeline(roadmap: SkillRoadmapItem[]): string {
  const totalWeeks = roadmap.reduce((sum, item) => sum + item.estimatedWeeks, 0);
  const months = Math.ceil(totalWeeks / 4);
  return `${months} month${months !== 1 ? 's' : ''}`;
}
