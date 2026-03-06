import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const riskLevelMap = {
  0: 'low',
  1: 'medium',
  2: 'high',
  3: 'critical',
};

export function createSmartSiteTools() {
  const evaluateSafetyRisk = new DynamicStructuredTool({
    name: 'evaluate_safety_risk',
    description: '\u8bc4\u4f30\u667a\u6167\u5de5\u5730\u4f5c\u4e1a\u98ce\u9669\u7b49\u7ea7\u3002\u9002\u7528\u4e8e\u540a\u88c5\u3001\u9ad8\u5904\u4f5c\u4e1a\u3001\u6df1\u57fa\u5751\u3001\u591c\u95f4\u4f5c\u4e1a\u548c\u6076\u52a3\u5929\u6c14\u573a\u666f\u3002',
    schema: z.object({
      operationType: z.string().describe('\u4f5c\u4e1a\u7c7b\u578b\uff0c\u4f8b\u5982\uff1a\u5854\u540a\u540a\u88c5 / \u811a\u624b\u67b6\u4f5c\u4e1a / \u57fa\u5751\u5f00\u6316'),
      windLevel: z.number().min(0).max(17).describe('\u98ce\u529b\u7b49\u7ea7\uff08\u84b2\u798f\u98ce\u7ea7\uff09'),
      heightMeters: z.number().min(0).describe('\u4f5c\u4e1a\u9ad8\u5ea6\uff08\u7c73\uff09'),
      workersOnSite: z.number().min(0).describe('\u73b0\u573a\u4f5c\u4e1a\u4eba\u6570\u4f30\u7b97'),
      isNightShift: z.boolean().default(false),
    }),
    func: async ({ operationType, windLevel, heightMeters, workersOnSite, isNightShift }) => {
      let score = 0;
      if (windLevel >= 8) score += 2;
      else if (windLevel >= 6) score += 1;
      if (heightMeters >= 20) score += 2;
      else if (heightMeters >= 8) score += 1;
      if (workersOnSite >= 30) score += 1;
      if (isNightShift) score += 1;
      if (/crane|lifting|hoist|\u540a\u88c5|\u5854\u540a/i.test(operationType)) score += 1;
      if (/excavation|deep pit|\u57fa\u5751|\u6df1\u57fa\u5751/i.test(operationType)) score += 1;

      const normalized = Math.min(3, Math.floor(score / 2));
      const level = riskLevelMap[normalized];

      const controls = [];
      if (level === 'critical' || level === 'high') {
        controls.push('\u7acb\u5373\u5f00\u5c55\u73ed\u524d\u5b89\u5168\u6280\u672f\u4ea4\u5e95\uff0c\u5e76\u7531\u4e13\u804c\u5b89\u5168\u5458\u73b0\u573a\u65c1\u7ad9\u3002');
      }
      if (windLevel >= 6) {
        controls.push('\u6301\u7eed\u76d1\u6d4b\u5b9e\u65f6\u98ce\u901f\uff0c\u8fbe\u5230\u505c\u5de5\u9608\u503c\u65f6\u7acb\u5373\u505c\u6b62\u540a\u88c5\u4e0e\u9ad8\u5904\u4f5c\u4e1a\u3002');
      }
      if (heightMeters >= 8) {
        controls.push('\u590d\u6838\u751f\u547d\u7ef3\u3001\u4e34\u8fb9\u9632\u62a4\u548c\u53cc\u94a9\u5b89\u5168\u5e26\u4f7f\u7528\u60c5\u51b5\u3002');
      }
      if (isNightShift) {
        controls.push('\u8865\u5145\u7167\u660e\u4e0e\u591c\u95f4\u5de1\u68c0\u9891\u6b21\uff0c\u786e\u8ba4\u5e94\u6025\u901a\u9053\u901a\u7545\u3002');
      }
      if (controls.length === 0) {
        controls.push('\u7ef4\u6301\u5e38\u89c4\u5de1\u68c0\u548c\u6807\u51c6\u4f5c\u4e1a\u6d41\u7a0b\u3002');
      }

      return JSON.stringify(
        {
          operationType,
          riskLevel: level,
          score,
          controls,
        },
        null,
        2,
      );
    },
  });

  const generatePreShiftChecklist = new DynamicStructuredTool({
    name: 'generate_pre_shift_checklist',
    description: '\u751f\u6210\u667a\u6167\u5de5\u5730\u73ed\u524d\u68c0\u67e5\u6e05\u5355\uff0c\u9002\u7528\u4e8e\u73ed\u524d\u4f1a\u3001\u6668\u4f1a\u7b49\u573a\u666f\u3002',
    schema: z.object({
      operationType: z.string().describe('\u672c\u73ed\u6b21\u6838\u5fc3\u4f5c\u4e1a\u7c7b\u578b'),
      weather: z.string().default('\u672a\u77e5').describe('\u5f53\u524d\u5929\u6c14\u548c\u73b0\u573a\u73af\u5883'),
      keyHazards: z.array(z.string()).default([]).describe('\u91cd\u70b9\u98ce\u9669\u9879\u5217\u8868'),
    }),
    func: async ({ operationType, weather, keyHazards }) => {
      const checklist = [
        `\u4f5c\u4e1a\u7c7b\u578b\u786e\u8ba4\uff1a${operationType}`,
        `\u5929\u6c14\u4e0e\u73af\u5883\u786e\u8ba4\uff1a${weather}`,
        '\u4eba\u5458\u8d44\u8d28\u4e0e\u7279\u79cd\u4f5c\u4e1a\u8bc1\u590d\u6838',
        '\u4e2a\u4eba\u9632\u62a4\u88c5\u5907\uff08PPE\uff09\u4f69\u6234\u68c0\u67e5',
        '\u673a\u68b0\u8bbe\u5907\u70b9\u68c0\u4e0e\u8bd5\u8fd0\u884c',
        '\u5e94\u6025\u5668\u6750\u3001\u6d88\u9632\u5668\u6750\u5b8c\u597d\u6027\u68c0\u67e5',
        '\u4f5c\u4e1a\u8bb8\u53ef\u7968\u4e0e\u98ce\u9669\u544a\u77e5\u7b7e\u5b57\u786e\u8ba4',
      ];
      keyHazards.forEach((hazard, idx) => checklist.push(`\u91cd\u70b9\u98ce\u9669${idx + 1}\uff1a${hazard}`));
      return checklist.join('\n');
    },
  });

  const checkPermitRequirements = new DynamicStructuredTool({
    name: 'check_permit_requirements',
    description:
      '\u67e5\u8be2\u667a\u6167\u5de5\u5730\u7279\u6b8a\u4f5c\u4e1a\u6240\u9700\u7684\u8bb8\u53ef\u8bc1\u6e05\u5355\uff0c\u4f8b\u5982\u52a8\u706b\u3001\u540a\u88c5\u3001\u53d7\u9650\u7a7a\u95f4\u3001\u4e34\u65f6\u7528\u7535\u7b49\u3002',
    schema: z.object({
      operationType: z.string().describe('\u5f85\u6267\u884c\u4f5c\u4e1a\u7c7b\u578b'),
    }),
    func: async ({ operationType }) => {
      const lower = operationType.toLowerCase();
      const permits = [];

      if (/hot|weld|cut|\u52a8\u706b|\u710a\u63a5|\u5207\u5272/.test(lower)) permits.push('\u52a8\u706b\u4f5c\u4e1a\u7968');
      if (/lift|crane|\u540a\u88c5|\u5854\u540a/.test(lower)) permits.push('\u8d77\u91cd\u540a\u88c5\u4f5c\u4e1a\u7968');
      if (/confined|\u53d7\u9650\u7a7a\u95f4/.test(lower)) permits.push('\u53d7\u9650\u7a7a\u95f4\u4f5c\u4e1a\u7968');
      if (/electric|\u4e34\u7535|\u914d\u7535/.test(lower)) permits.push('\u4e34\u65f6\u7528\u7535\u4f5c\u4e1a\u7968');
      if (/height|\u9ad8\u5904|\u811a\u624b\u67b6/.test(lower)) permits.push('\u9ad8\u5904\u4f5c\u4e1a\u7968');
      if (/excavat|\u57fa\u5751|\u5f00\u6316/.test(lower)) permits.push('\u571f\u65b9\u5f00\u6316/\u57fa\u5751\u4e13\u9879\u5ba1\u6279');

      if (permits.length === 0) {
        permits.push('\u5e38\u89c4\u4f5c\u4e1a\u5ba1\u6279\u6d41\u7a0b\uff08\u542b\u73ed\u7ec4\u957f\u4e0e\u5b89\u5168\u5458\u7b7e\u5b57\uff09');
      }
      return JSON.stringify({ operationType, requiredPermits: permits }, null, 2);
    },
  });

  return [evaluateSafetyRisk, generatePreShiftChecklist, checkPermitRequirements];
}
