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
        description: 'Evaluate safety risk level for smart construction operation. Use it for crane lifting, high-altitude work, deep pit work, night shift, and severe weather scenarios.',
        schema: z.object({
            operationType: z.string().describe('Operation type, e.g. tower crane lifting / scaffolding / excavation'),
            windLevel: z.number().min(0).max(17).describe('Wind level in Beaufort scale'),
            heightMeters: z.number().min(0).describe('Work-at-height meters'),
            workersOnSite: z.number().min(0).describe('Estimated number of workers'),
            isNightShift: z.boolean().default(false),
        }),
        func: async ({ operationType, windLevel, heightMeters, workersOnSite, isNightShift }) => {
            let score = 0;
            if (windLevel >= 8)
                score += 2;
            else if (windLevel >= 6)
                score += 1;
            if (heightMeters >= 20)
                score += 2;
            else if (heightMeters >= 8)
                score += 1;
            if (workersOnSite >= 30)
                score += 1;
            if (isNightShift)
                score += 1;
            if (/crane|lifting|hoist|吊装|塔吊/i.test(operationType))
                score += 1;
            if (/excavation|deep pit|基坑|深基坑/i.test(operationType))
                score += 1;
            const normalized = Math.min(3, Math.floor(score / 2));
            const level = riskLevelMap[normalized];
            const controls = [];
            if (level === 'critical' || level === 'high') {
                controls.push('立即进行班前安全技术交底，并由专职安全员现场旁站。');
            }
            if (windLevel >= 6) {
                controls.push('关注实时风速，达到停工阈值立即停止起重和高空作业。');
            }
            if (heightMeters >= 8) {
                controls.push('复核生命绳、临边防护、双钩安全带使用情况。');
            }
            if (isNightShift) {
                controls.push('补充照明和夜间巡检频次，确认应急通道通畅。');
            }
            if (controls.length === 0) {
                controls.push('维持常规巡检和标准作业流程。');
            }
            return JSON.stringify({
                operationType,
                riskLevel: level,
                score,
                controls,
            }, null, 2);
        },
    });
    const generatePreShiftChecklist = new DynamicStructuredTool({
        name: 'generate_pre_shift_checklist',
        description: 'Generate pre-shift checklist for smart construction site. Use this when user asks for morning briefing, toolbox talk, or shift checklist.',
        schema: z.object({
            operationType: z.string(),
            weather: z.string().default('unknown'),
            keyHazards: z.array(z.string()).default([]),
        }),
        func: async ({ operationType, weather, keyHazards }) => {
            const checklist = [
                `作业类型确认: ${operationType}`,
                `天气与环境确认: ${weather}`,
                '人员资质与特种作业证复核',
                '个人防护装备(PPE)佩戴检查',
                '机械设备点检与试运行',
                '应急器材、消防器材完好性检查',
                '作业许可票与风险告知签字确认',
            ];
            keyHazards.forEach((hazard, idx) => checklist.push(`重点风险${idx + 1}: ${hazard}`));
            return checklist.join('\n');
        },
    });
    const checkPermitRequirements = new DynamicStructuredTool({
        name: 'check_permit_requirements',
        description: 'Return required permits for special operations in smart construction site (hot work, lifting, confined space, temporary electricity, etc).',
        schema: z.object({
            operationType: z.string(),
        }),
        func: async ({ operationType }) => {
            const lower = operationType.toLowerCase();
            const permits = [];
            if (/hot|weld|cut|动火|焊接|切割/.test(lower))
                permits.push('动火作业票');
            if (/lift|crane|吊装|塔吊/.test(lower))
                permits.push('起重吊装作业票');
            if (/confined|受限空间/.test(lower))
                permits.push('受限空间作业票');
            if (/electric|临电|配电/.test(lower))
                permits.push('临时用电作业票');
            if (/height|高处|脚手架/.test(lower))
                permits.push('高处作业票');
            if (/excavat|基坑|开挖/.test(lower))
                permits.push('土方开挖/基坑专项审批');
            if (permits.length === 0) {
                permits.push('常规作业审批流程（含班组长与安全员签字）');
            }
            return JSON.stringify({ operationType, requiredPermits: permits }, null, 2);
        },
    });
    return [evaluateSafetyRisk, generatePreShiftChecklist, checkPermitRequirements];
}
