import { Metadata } from "next";
import { getStoreProducts, getPurchaseHistory } from "@/actions/store";
import { ShoppingBag, Box, BadgeCheck, FileText, Video, Sparkles } from "lucide-react";
import { CheckoutButton } from "@/components/store/checkout-button";

export const metadata: Metadata = {
    title: "Digital Store | CareerVelocity",
    description: "Purchase premium templates, career guides, and 1:1 coaching sessions.",
};

const ProductIconMap: Record<string, any> = {
    template: FileText,
    guide: Box,
    coaching: Video,
};

export default async function StorePage({
    searchParams,
}: {
    searchParams: { success?: string; canceled?: string };
}) {
    const productsRes = await getStoreProducts();
    const historyRes = await getPurchaseHistory();

    const products = productsRes.success ? productsRes.data : [];
    const purchasedIds = new Set(
        historyRes.success ? (historyRes.data?.map((p: any) => p.digitalProductId) ?? []) : []
    );

    return (
        <div className="flex-1 overflow-y-auto px-4 py-8 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* ── Header ────────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-brand-500/10 rounded-lg">
                                <ShoppingBag className="w-6 h-6 text-brand-400" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                Premium Store
                            </h1>
                        </div>
                        <p className="text-surface-400 max-w-2xl">
                            Unlock career-accelerating digital goods. Purchase premium ATS templates, comprehensive guides, or book a 1:1 strategy session with our top recruiters.
                        </p>
                    </div>
                </div>

                {/* ── Payment Feedback ───────────────────────────────────────────── */}
                {searchParams.success && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <BadgeCheck className="w-5 h-5 flex-shrink-0" />
                        <p><strong>Payment Successful!</strong> Your digital content has been unlocked below.</p>
                    </div>
                )}

                {searchParams.canceled && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <Sparkles className="w-5 h-5 flex-shrink-0" />
                        <p>Checkout was canceled. We hope you reconsider boosting your career with CareerVelocity!</p>
                    </div>
                )}

                {/* ── Product Grid ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products?.map((product: any) => {
                        const Icon = ProductIconMap[product.productType] || Box;
                        const isPurchased = purchasedIds.has(product.id);
                        // Cast decimal to number for UI format
                        const priceNum = typeof product.price === 'number' ? product.price : parseFloat(product.price.toString());

                        return (
                            <div
                                key={product.id}
                                className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${isPurchased
                                    ? "bg-surface-800/50 border-white/5 opacity-80"
                                    : "bg-surface-800 hover:bg-surface-700/50 border-white/10 hover:border-brand-500/50 shadow-xl hover:shadow-brand-500/10"
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${isPurchased ? 'bg-surface-700' : 'bg-brand-500/10'}`}>
                                        <Icon className={`w-6 h-6 ${isPurchased ? 'text-surface-400' : 'text-brand-400'}`} />
                                    </div>
                                    <span className="text-xs font-semibold py-1 px-3 bg-surface-900 rounded-full border border-white/5 text-surface-300 uppercase tracking-wider">
                                        {product.productType}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-3 mb-6">
                                    <h3 className="text-xl font-bold text-white line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-surface-400 line-clamp-4">
                                        {product.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-white">${priceNum.toFixed(2)}</span>
                                        <span className="text-sm text-surface-400">USD</span>
                                    </div>

                                    <CheckoutButton
                                        productId={product.id}
                                        isPurchased={isPurchased}
                                        accessUrl={product.accessUrl}
                                        price={priceNum}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {(!products || products.length === 0) && (
                        <div className="col-span-full py-12 text-center text-surface-500">
                            No digital products are currently available in the storefront.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
