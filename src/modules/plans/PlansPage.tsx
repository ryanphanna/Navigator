import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Shield } from 'lucide-react';
import { ROUTES, PLAN_LIMITS, PLAN_PRICING, USER_TIERS, HEADLINES } from '../../constants';
import { getFeaturesForPlan } from '../../featureRegistry';
import { useUser } from '../../contexts/UserContext';
import { useModal } from '../../contexts/ModalContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { PlanCard } from '../../components/ui/PlanCard';

export const PlansPage: React.FC = () => {


    const { user, userTier } = useUser();
    const { openModal } = useModal();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isAnnual, setIsAnnual] = useState(false);
    const [loadingTier, setLoadingTier] = useState<string | null>(null);

    // Cycle headline on each visit
    const headline = useMemo(() => {
        const choices = HEADLINES.plans;
        return choices[Math.floor(Math.random() * choices.length)];
    }, []);

    const plusPrice = isAnnual ? PLAN_PRICING[USER_TIERS.PLUS].ANNUAL_MONTHLY : PLAN_PRICING[USER_TIERS.PLUS].MONTHLY;
    const proPrice = isAnnual ? PLAN_PRICING[USER_TIERS.PRO].ANNUAL_MONTHLY : PLAN_PRICING[USER_TIERS.PRO].MONTHLY;

    useEffect(() => {
        if (searchParams.get('success')) {
            navigate(ROUTES.PLANS, { replace: true });
        }
    }, [searchParams, navigate]);



    const handleSelectPlan = async (tier: string) => {
        if (tier === userTier) {
            navigate(ROUTES.HOME);
            return;
        }

        if (tier === USER_TIERS.FREE) {
            navigate(ROUTES.WELCOME);
            return;
        }

        // Require authentication for paid plans
        if (!user) {
            openModal('AUTH');
            return;
        }

        setLoadingTier(tier);
        try {
            let priceId = '';
            if (tier === USER_TIERS.PLUS) {
                priceId = isAnnual ? PLAN_PRICING[USER_TIERS.PLUS].PRICE_ID_ANNUAL : PLAN_PRICING[USER_TIERS.PLUS].PRICE_ID_MONTHLY;
            } else if (tier === USER_TIERS.PRO) {
                priceId = isAnnual ? PLAN_PRICING[USER_TIERS.PRO].PRICE_ID_ANNUAL : PLAN_PRICING[USER_TIERS.PRO].PRICE_ID_MONTHLY;
            }

            if (!priceId || priceId.includes('placeholder')) {
                alert('Stripe configuration missing. Please check .env or constants.');
                return;
            }

            const { url } = await paymentService.createCheckoutSession(priceId);
            window.location.href = url;

        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            const errorMsg = error.message || 'Unknown error';

            if (errorMsg === 'User not authenticated') {
                openModal('AUTH');
            } else {
                alert(`Checkout Error: ${errorMsg}`);
            }
        } finally {
            setLoadingTier(null);
        }
    };


    return (
        <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-[#0a0a0a]">


            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16 space-y-5">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight"
                    >
                        {headline.text} <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">{headline.highlight}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-neutral-500 dark:text-neutral-400 text-lg max-w-2xl mx-auto"
                    >
                        Choose the plan that fits your pace — from exploring to all-in.
                    </motion.p>

                    {/* Monthly / Annual Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-3 pt-2"
                    >
                        <div className="relative inline-flex p-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                            {/* Sliding highlight */}
                            <div
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-neutral-800 shadow-sm transition-transform duration-300 ease-out ${isAnnual ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`}
                            />
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`relative z-10 px-5 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${!isAnnual ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`relative z-10 px-5 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${isAnnual ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                            >
                                Annual
                            </button>
                        </div>
                        {isAnnual && (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full animate-in fade-in zoom-in-95 duration-200">
                                Save up to 21%
                            </span>
                        )}
                    </motion.div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 max-w-5xl mx-auto px-4 items-stretch">
                {/* Explorer Plan */}
                <PlanCard
                    title="Explorer"
                    price="$0"
                    accentColor="slate"
                    buttonText={
                        !user ? 'Start Free Trial' :
                            (userTier === USER_TIERS.FREE || !userTier) ? 'Current Plan' :
                                (userTier === USER_TIERS.ADMIN || userTier === USER_TIERS.TESTER) ? 'Your access exceeds this' :
                                    'Trial Plan'
                    }
                    onSelect={() => handleSelectPlan(USER_TIERS.FREE)}
                    features={getFeaturesForPlan('explorer').map(f => ({ name: f.name, desc: f.description.plan }))}
                    limits={{
                        analyses: String(PLAN_LIMITS[USER_TIERS.FREE].TOTAL_ANALYSES),
                        analysesPeriod: 'total',
                        emails: PLAN_LIMITS[USER_TIERS.FREE].DAILY_EMAILS,
                        mentors: PLAN_LIMITS[USER_TIERS.FREE].MENTORS
                    }}
                />

                {/* Plus Plan */}
                <PlanCard
                    title="Plus"
                    price={`$${plusPrice}`}
                    accentColor="indigo"
                    subText="Everything in Explorer, plus..."
                    buttonText={userTier === USER_TIERS.PLUS ? 'Current Plan' : 'Upgrade to Plus'}
                    onSelect={() => handleSelectPlan(USER_TIERS.PLUS)}
                    isLoading={loadingTier === USER_TIERS.PLUS}
                    features={getFeaturesForPlan('plus').map(f => ({ name: f.name, desc: f.description.plan }))}
                    limits={{
                        analyses: String(PLAN_LIMITS[USER_TIERS.PLUS].WEEKLY_ANALYSES),
                        analysesPeriod: 'week',
                        emails: PLAN_LIMITS[USER_TIERS.PLUS].DAILY_EMAILS,
                        mentors: PLAN_LIMITS[USER_TIERS.PLUS].MENTORS
                    }}
                />

                {/* Pro Plan */}
                <PlanCard
                    title="Pro"
                    price={`$${proPrice}`}
                    isPopular={true}
                    accentColor="emerald"
                    subText="Everything in Plus, plus..."
                    buttonText={userTier === USER_TIERS.PRO ? 'Current Plan' : 'Upgrade to Pro'}
                    onSelect={() => handleSelectPlan(USER_TIERS.PRO)}
                    isLoading={loadingTier === USER_TIERS.PRO}
                    features={getFeaturesForPlan('pro').map(f => ({ name: f.name, desc: f.description.plan }))}
                    limits={{
                        analyses: 'Unlimited',
                        analysesPeriod: '',
                        emails: PLAN_LIMITS[USER_TIERS.PRO].DAILY_EMAILS,
                        mentors: PLAN_LIMITS[USER_TIERS.PRO].MENTORS
                    }}
                />
            </div>

            {/* Features Link */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center mt-12"
            >
                <a
                    href="/features"
                    className="group flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                    Explore all features
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <span className="text-[10px] text-neutral-300 dark:text-neutral-600 font-medium mt-3 block text-center">
                    Have a promo code? You can apply it at checkout.
                </span>
            </motion.div>

            {/* FAQ or Trust Badge Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-24 pt-12 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto px-4"
            >
                <div className="flex gap-4 items-start text-left">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Instant Activation</h4>
                        <p className="text-sm text-neutral-500">Upgrade and get access to premium features immediately.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Cancel Anytime</h4>
                        <p className="text-sm text-neutral-500">No contracts or hidden fees. Cancel in one click.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-1">No Commitments</h4>
                        <p className="text-sm text-neutral-500">Upgrade or downgrade your plan at any time.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PlansPage;
