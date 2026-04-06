export const createId = () => crypto.randomUUID();

export const calculateIvaFromTotal = (total: number, rate = 0.21) => {
	if (!Number.isFinite(total) || total <= 0) return 0;

	return total - total / (1 + rate);
};
