import { Activity, Twitter, Linkedin, Github, Mail, Heart } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "How It Works", "Changelog", "Roadmap"],
  Health: ["Diabetes Guide", "Blood Monitoring", "AI Insights", "Research", "Clinical Partners"],
  Company: ["About Us", "Blog", "Careers", "Press Kit", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "HIPAA Notice", "Accessibility"],
};

const socialLinks = [
  { icon: Twitter, label: "Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Github, label: "GitHub" },
  { icon: Mail, label: "Email" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white" style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                Dia<span className="text-blue-400">Check</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 mb-6 max-w-xs">
              AI-powered diabetes screening and blood health monitoring. Know your health. Act early. Live better.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label }) => (
                null
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white text-xs font-semibold tracking-wider uppercase mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              © 2026 DiaCheck Health Technologies, Inc. All rights reserved.
            </p>
            
            <p className="text-xs text-slate-600">
              ⚕️ Not a substitute for professional medical advice
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
