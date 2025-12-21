"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Users,
  FileText,
  BarChart3,
  Mail,
  Smartphone,
  Palette,
  Bell,
  CreditCard,
  Package,
  MapPin,
  Phone,
  UserCog,
  Plug,
  Code,
  Star,
  TrendingUp,
  Globe,
  Lock,
  Headphones,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscriptionService } from "@/lib/services/subscription.service";
import { toast } from "sonner";

const billingPeriods = [
  { label: "Monthly", value: "monthly", multiplier: 1 },
  { label: "Quarterly", value: "quarterly", multiplier: 3, discount: 10 },
  { label: "Annually", value: "annually", multiplier: 12, discount: 25 },
];

const plans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Best for solo entrepreneurs",
    description: "Perfect for individuals getting started",
    price: 49,
    regularPrice: 279,
    discount: 82,
    popular: false,
    features: [
      { text: "Create up to 5 clients", icon: Users, included: true, badge: undefined },
      { text: "10 invoices per month", icon: FileText, included: true, badge: undefined },
      { text: "Basic reporting", icon: BarChart3, included: true, badge: undefined },
      { text: "Email support", icon: Mail, included: true, badge: undefined },
      { text: "Mobile app access", icon: Smartphone, included: true, badge: undefined },
      { text: "1 user account", icon: Users, included: true, badge: undefined },
      { text: "Weekly auto backups", icon: Shield, included: true, badge: undefined },
      { text: "Free SSL security", icon: Lock, included: true, badge: undefined },
      { text: "Custom branding", icon: Palette, included: false, badge: undefined },
      { text: "Payment reminders", icon: Bell, included: false, badge: undefined },
      { text: "Priority support", icon: Headphones, included: false, badge: undefined },
    ],
    details: [
      "Perfect for testing the platform",
      "All core features included",
      "Easy setup in minutes",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Everything you need to get started",
    description: "Most businesses start here",
    price: 109,
    regularPrice: 399,
    discount: 73,
    popular: true,
    bonusMonths: 3,
    features: [
      { text: "Create up to 50 clients", icon: Users, included: true },
      { text: "Unlimited invoices", icon: FileText, included: true },
      {
        text: "Advanced reporting & analytics",
        icon: BarChart3,
        included: true,
      },
      { text: "Priority email support", icon: Mail, included: true, badge: undefined },
      { text: "Mobile app access", icon: Smartphone, included: true, badge: undefined },
      { text: "Up to 5 users", icon: Users, included: true, badge: undefined },
      { text: "Custom branding", icon: Palette, included: true, badge: undefined },
      { text: "Payment reminders", icon: Bell, included: true, badge: undefined },
      { text: "Expense tracking", icon: CreditCard, included: true, badge: undefined },
      { text: "Daily backups", icon: Shield, included: true, badge: undefined },
      {
        text: "Email marketing for 1 year",
        icon: Mail,
        included: true,
        badge: "FREE",
      },
      { text: "API access", icon: Code, included: false, badge: undefined },
      { text: "Dedicated account manager", icon: UserCog, included: false, badge: undefined },
    ],
    details: [
      "All benefits of Starter, plus:",
      "Free domain for 1 year",
      "Advanced automation features",
      "Priority customer support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "More tools and power for growth",
    description: "Advanced features for established businesses",
    price: 169,
    regularPrice: 499,
    discount: 65,
    popular: false,
    bonusMonths: 3,
    features: [
      { text: "Unlimited clients", icon: Users, included: true, badge: undefined },
      { text: "Unlimited invoices", icon: FileText, included: true, badge: undefined },
      { text: "Advanced inventory management", icon: Package, included: true, badge: undefined },
      { text: "Multi-location support", icon: MapPin, included: true, badge: undefined },
      { text: "24/7 phone support", icon: Phone, included: true, badge: undefined },
      { text: "Unlimited users", icon: Users, included: true, badge: undefined },
      { text: "Dedicated account manager", icon: UserCog, included: true, badge: undefined },
      { text: "Custom integrations", icon: Plug, included: true, badge: undefined },
      { text: "Full API access", icon: Code, included: true, badge: undefined },
      { text: "Priority feature requests", icon: Star, included: true, badge: undefined },
      { text: "Advanced security features", icon: Shield, included: true, badge: undefined },
      {
        text: "Real-time analytics",
        icon: TrendingUp,
        included: true,
        badge: "NEW",
      },
      { text: "White-label solution", icon: Globe, included: true, badge: undefined },
    ],
    details: [
      "Everything in Professional, plus:",
      "Dedicated infrastructure",
      "Custom SLA agreements",
      "Advanced compliance features",
    ],
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Bank-level Security",
    description: "Your data is protected with enterprise-grade encryption",
  },
  {
    icon: Clock,
    title: "99.9% Uptime Guarantee",
    description: "Reliable service you can count on, always available",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance for smooth workflows",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Get help whenever you need it from our team",
  },
];

export default function PlansPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("annually");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const currentPeriod = billingPeriods.find((p) => p.value === selectedPeriod)!;

  const calculatePrice = (basePrice: number) => {
    const discount = currentPeriod.discount || 0;
    return Math.round(basePrice * (1 - discount / 100));
  };

  const calculateSavings = (basePrice: number) => {
    const discount = currentPeriod.discount || 0;
    return Math.round(basePrice * (discount / 100));
  };

  const calculateTotalPrice = (basePrice: number) => {
    return calculatePrice(basePrice) * currentPeriod.multiplier;
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      // User is not logged in, redirect to signup
      router.push(`/signup`);
      return;
    }

    // Mock checkout process
    setProcessingPlan(planId);

    try {
      toast.loading("Processing your subscription...", { id: "subscription" });

      // Simulate payment processing
      await subscriptionService.mockCheckout(planId, user.id);

      // Activate subscription
      await subscriptionService.activateSubscription({
        userId: user.id,
        planId,
      });

      toast.success("Subscription activated successfully!", {
        id: "subscription",
      });

      // Redirect to company setup
      setTimeout(() => {
        router.push("/company-setup");
      }, 1000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process subscription",
        { id: "subscription" }
      );
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-primary/10 via-primary/2 to-background px-6 py-10">
        {/* Decorative Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 size-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-40 -bottom-40 size-80 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-6 animate-in fade-in slide-in-from-top-3 duration-700 px-4 py-1.5 text-sm"
            >
              <Sparkles className="mr-2 size-3.5" />
              Flexible Pricing Plans
            </Badge>
            <h1 className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Choose a plan – get online today
            </h1>
            <p className="text-muted-foreground animate-in fade-in slide-in-from-top-5 duration-700 mx-auto max-w-2xl text-lg md:text-xl">
              Join thousands of businesses managing their finances smarter.{" "}
              <span className="font-semibold text-foreground">
                30-day money-back guarantee
              </span>{" "}
              on all plans.
            </p>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <div className="bg-background/80 backdrop-blur-sm flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-sm transition-all hover:shadow-md">
                <div className="bg-primary/10 flex size-6 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-primary size-4" />
                </div>
                <span className="text-sm font-medium">30-day money-back</span>
              </div>
              <div className="bg-background/80 backdrop-blur-sm flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-sm transition-all hover:shadow-md">
                <div className="bg-primary/10 flex size-6 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-primary size-4" />
                </div>
                <span className="text-sm font-medium">24/7 support</span>
              </div>
              <div className="bg-background/80 backdrop-blur-sm flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-sm transition-all hover:shadow-md">
                <div className="bg-primary/10 flex size-6 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-primary size-4" />
                </div>
                <span className="text-sm font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Billing Period Selector */}
          <div className="mt-12 flex justify-center">
            <div className="bg-muted inline-flex gap-1 rounded-xl p-1.5 shadow-sm">
              {billingPeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`relative rounded-lg px-8 py-3.5 text-sm font-semibold transition-all duration-300 ${
                    selectedPeriod === period.value
                      ? "bg-background text-foreground shadow-md scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <span className="relative z-10">{period.label}</span>
                  {period.discount && (
                    <span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs font-bold shadow-sm">
                      -{period.discount}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan, idx) => (
              <Card
                key={plan.id}
                className={`group relative flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-2 ${
                  plan.popular
                    ? "border-primary shadow-2xl ring-2 ring-primary/20 lg:scale-[1.05] hover:shadow-primary/10"
                    : "border-border shadow-md hover:shadow-2xl hover:border-primary/30"
                }`}
              >
                {/* Top Accent Bar */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${
                    plan.popular
                      ? "bg-primary"
                      : "bg-muted-foreground/20 group-hover:bg-primary"
                  } transition-colors duration-300`}
                />

                {plan.popular && (
                  <div className="bg-primary absolute -top-5 left-1/2 z-10 -translate-x-1/2 rounded-full px-6 py-1.5 shadow-lg ring-2 ring-background">
                    <span className="text-primary-foreground flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                      <Star className="size-3 fill-current" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {plan.discount && (
                  <div className="absolute right-4 top-4 z-10">
                    <Badge className="bg-primary px-3 py-1 text-primary-foreground shadow-lg">
                      {plan.discount}% OFF
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-6 pt-8">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {plan.name}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                      {plan.tagline}
                    </p>
                    <CardDescription className="mt-2 text-sm">
                      {plan.description}
                    </CardDescription>
                  </div>

                  <div className="mt-8 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent text-5xl font-extrabold tracking-tighter">
                        ₱{calculatePrice(plan.price)}
                      </span>
                      <span className="text-muted-foreground text-lg font-medium">
                        /mo
                      </span>
                    </div>
                    {plan.bonusMonths && (
                      <Badge variant="secondary" className="mt-2 font-semibold">
                        +{plan.bonusMonths} mo. free
                      </Badge>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-muted-foreground text-sm line-through">
                        ₱{plan.regularPrice}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/10 text-primary"
                      >
                        Save ₱{plan.regularPrice - calculatePrice(plan.price)}
                        /mo
                      </Badge>
                    </div>
                    {currentPeriod.value !== "monthly" && (
                      <p className="text-muted-foreground mt-3 text-sm">
                        Get {currentPeriod.multiplier} months for{" "}
                        <span className="font-semibold text-foreground">
                          ₱{calculateTotalPrice(plan.price).toLocaleString()}
                        </span>{" "}
                        (regular price ₱
                        {(
                          plan.regularPrice * currentPeriod.multiplier
                        ).toLocaleString()}
                        ). Renews at ₱{plan.price}/mo.
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col space-y-6">
                  <Button
                    size="lg"
                    variant={plan.popular ? "default" : "outline"}
                    className="group/btn w-full font-semibold shadow-sm hover:shadow-md transition-all"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading || processingPlan === plan.id}
                  >
                    {processingPlan === plan.id
                      ? "Processing..."
                      : isLoading
                      ? "Loading..."
                      : user
                      ? "Subscribe Now"
                      : "Get Started"}
                    <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Button>

                  <div className="space-y-4 border-t pt-6">
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div
                          key={index}
                          className={`group/feature flex items-start gap-3 transition-colors ${
                            !feature.included ? "opacity-40" : ""
                          }`}
                        >
                          {feature.included ? (
                            <div className="bg-primary/10 flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5 group-hover/feature:bg-primary/20 transition-colors">
                              <CheckCircle2 className="text-primary size-3.5" />
                            </div>
                          ) : (
                            <div className="bg-muted flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5">
                              <X className="text-muted-foreground size-3.5" />
                            </div>
                          )}
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-sm leading-tight">
                              {feature.text}
                            </span>
                            {feature?.badge && (
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 font-bold"
                              >
                                {feature?.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {plan.details && (
                      <div className="border-muted mt-6 space-y-2 border-t pt-4">
                        {plan.details.map((detail, idx) => (
                          <p
                            key={idx}
                            className={`text-muted-foreground text-xs ${
                              idx === 0 ? "font-semibold" : ""
                            }`}
                          >
                            {detail}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Info Banner */}
          <div className="bg-muted/50 mt-12 rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              All plans are paid upfront. The monthly rate reflects the total
              plan price divided by the number of months in your plan.{" "}
              <button className="text-primary hover:underline font-medium">
                Compare all features
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-y bg-linear-to-b from-muted/30 to-background px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4">
              Premium Benefits
            </Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Included with every plan
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Get access to premium features and enterprise-grade
              infrastructure, no matter which plan you choose
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="group border-muted hover:border-primary/50 transition-all duration-500 hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="flex flex-col items-start p-6">
                  <div className="bg-primary/10 text-primary mb-4 flex size-16 items-center justify-center rounded-2xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:bg-primary/20">
                    <benefit.icon className="size-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Pricing FAQs
            </h2>
            <p className="text-muted-foreground text-lg">
              Have questions? We're here to help.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                q: "Can I change my plan later?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, Mastercard, AmEx), debit cards, and digital wallets like GCash and PayMaya. All payments are processed securely.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! All plans come with a 14-day free trial. No credit card required to start.",
              },
              {
                q: "Do you offer refunds?",
                a: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your payment in full within the first 30 days.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely! You can cancel your subscription at any time from your account settings. You'll have access until the end of your billing period.",
              },
              {
                q: "Is my data secure?",
                a: "Security is our top priority. We use bank-level encryption and comply with international data protection standards.",
              },
            ].map((faq, index) => (
              <Card
                key={index}
                className="group border-muted hover:border-primary/30 transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <h3 className="mb-3 text-base font-bold group-hover:text-primary transition-colors">
                    {faq.q}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Button variant="outline" size="lg">
              <Mail className="mr-2 size-4" />
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="bg-linear-to-br from-primary/10 via-primary/5 to-background relative mx-auto max-w-5xl overflow-hidden rounded-3xl border shadow-xl p-12 md:p-16">
          {/* Decorative gradient orbs */}
          <div className="absolute -right-32 -top-32 size-64 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-32 -left-32 size-64 rounded-full bg-primary/15 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          <div className="relative text-center">
            <Badge variant="secondary" className="mb-6 shadow-sm">
              <Sparkles className="mr-2 size-3" />
              Get Started Today
            </Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-lg">
              Start your free trial today. No credit card required.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="group shadow-lg hover:shadow-xl transition-all sm:w-auto"
                onClick={() => handleSelectPlan("professional")}
                disabled={isLoading}
              >
                Start Free Trial
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="shadow-sm hover:shadow-md transition-all sm:w-auto"
              >
                <Phone className="mr-2 size-4" />
                Contact Sales
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 flex size-6 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-primary size-4" />
                </div>
                <span className="text-sm font-medium">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 flex size-6 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-primary size-4" />
                </div>
                <span className="text-sm font-medium">
                  No credit card required
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 flex size-6 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-primary size-4" />
                </div>
                <span className="text-sm font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
