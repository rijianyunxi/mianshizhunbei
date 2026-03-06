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
    description: '评估智慧工地作业风险等级。适用于吊装、高处作业、深基坑、夜间作业和恶劣天气场景。',
    schema: z.object({
      operationType: z.string().describe('作业类型，例如：塔吊吊装 / 脚手架作业 / 基坑开挖'),
      windLevel: z.number().min(0).max(17).describe('风力等级（蒲福风级）'),
      heightMeters: z.number().min(0).describe('作业高度（米）'),
      workersOnSite: z.number().min(0).describe('现场作业人数估算'),
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
      if (/crane|lifting|hoist|吊装|塔吊/i.test(operationType)) score += 1;
      if (/excavation|deep pit|基坑|深基坑/i.test(operationType)) score += 1;

      const normalized = Math.min(3, Math.floor(score / 2));
      const level = riskLevelMap[normalized];

      const controls = [];
      if (level === 'critical' || level === 'high') {
        controls.push('立即开展班前安全技术交底，并由专职安全员现场旁站。');
      }
      if (windLevel >= 6) {
        controls.push('持续监测实时风速，达到停工阈值时立即停止吊装与高处作业。');
      }
      if (heightMeters >= 8) {
        controls.push('复核生命绳、临边防护和双钩安全带使用情况。');
      }
      if (isNightShift) {
        controls.push('补充照明与夜间巡检频次，确认应急通道通畅。');
      }
      if (controls.length === 0) {
        controls.push('维持常规巡检和标准作业流程。');
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
    description: '生成智慧工地班前检查清单，适用于班前会、晨会等场景。',
    schema: z.object({
      operationType: z.string().describe('本班次核心作业类型'),
      weather: z.string().default('未知').describe('当前天气和现场环境'),
      keyHazards: z.array(z.string()).default([]).describe('重点风险项列表'),
    }),
    func: async ({ operationType, weather, keyHazards }) => {
      const checklist = [
        `作业类型确认：${operationType}`,
        `天气与环境确认：${weather}`,
        '人员资质与特种作业证复核',
        '个人防护装备（PPE）佩戴检查',
        '机械设备点检与试运行',
        '应急器材、消防器材完好性检查',
        '作业许可票与风险告知签字确认',
      ];
      keyHazards.forEach((hazard, idx) => checklist.push(`重点风险${idx + 1}：${hazard}`));
      return checklist.join('\n');
    },
  });

  const checkPermitRequirements = new DynamicStructuredTool({
    name: 'check_permit_requirements',
    description:
      '查询智慧工地特殊作业所需的许可证清单，例如动火、吊装、受限空间、临时用电等。',
    schema: z.object({
      operationType: z.string().describe('待执行作业类型'),
    }),
    func: async ({ operationType }) => {
      const lower = operationType.toLowerCase();
      const permits = [];

      if (/hot|weld|cut|动火|焊接|切割/.test(lower)) permits.push('动火作业票');
      if (/lift|crane|吊装|塔吊/.test(lower)) permits.push('起重吊装作业票');
      if (/confined|受限空间/.test(lower)) permits.push('受限空间作业票');
      if (/electric|临电|配电/.test(lower)) permits.push('临时用电作业票');
      if (/height|高处|脚手架/.test(lower)) permits.push('高处作业票');
      if (/excavat|基坑|开挖/.test(lower)) permits.push('土方开挖/基坑专项审批');

      if (permits.length === 0) {
        permits.push('常规作业审批流程（含班组长与安全员签字）');
      }
      return JSON.stringify({ operationType, requiredPermits: permits }, null, 2);
    },
  });

  return [evaluateSafetyRisk, generatePreShiftChecklist, checkPermitRequirements];
}
