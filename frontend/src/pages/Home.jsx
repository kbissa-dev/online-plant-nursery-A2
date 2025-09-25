import React, { useState } from "react";

export const Header = () => {
  const [activeTab, setActiveTab] = useState("Shop All");

  const navigationItems = [
    { label: "Shop All", isActive: true },
    { label: "Outdoor Plants", isActive: false },
    { label: "Indoor Plants", isActive: false },
    { label: "Contact", isActive: false },
    { label: "About Us", isActive: false },
  ];

  const handleNavClick = (label) => {
    setActiveTab(label);
  };

  const handleLoginClick = () => {
    console.log("Login clicked");
  };

  const handleRegisterClick = () => {
    console.log("Register clicked");
  };

  return (
    <header className="flex flex-wrap w-[1728px] h-[130px] items-center gap-[var(--size-space-600)] pt-[var(--size-space-800)] pr-[var(--size-space-800)] pb-[var(--size-space-800)] pl-[var(--size-space-800)] relative bg-color-background-default-default border-b [border-bottom-style:solid] border-color-border-default-default">
      <div
        className="relative w-10 h-[35px]"
        role="img"
        aria-label="Company logo"
      />

      <nav
        className="flex flex-wrap items-start justify-end gap-[var(--size-space-200)] relative flex-1 grow"
        role="navigation"
        aria-label="Main navigation"
      >
        {navigationItems.map((item, index) => (
          <button
            key={item.label}
            onClick={() => handleNavClick(item.label)}
            className={`inline-flex items-center justify-center gap-[var(--size-space-200)] pt-[var(--size-space-200)] pr-[var(--size-space-200)] pb-[var(--size-space-200)] pl-[var(--size-space-200)] relative flex-[0_0_auto] rounded-[var(--size-radius-200)] transition-colors duration-200 hover:bg-color-background-brand-tertiary focus:outline-none focus:ring-2 focus:ring-color-border-brand-default focus:ring-offset-2 ${
              activeTab === item.label
                ? "bg-color-background-brand-tertiary"
                : ""
            }`}
            aria-current={activeTab === item.label ? "page" : undefined}
          >
            <span
              className={`relative w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal tracking-[0] leading-[27px] whitespace-nowrap ${
                activeTab === item.label
                  ? "text-color-text-brand-on-brand-secondary text-[27px]"
                  : "text-color-text-default-default text-[26px] leading-[26px]"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="flex w-[178px] items-center gap-[var(--size-space-300)] relative">
        <button
          onClick={handleLoginClick}
          className="all-[unset] box-border flex items-center justify-center gap-[var(--size-space-200)] pt-[var(--size-space-300)] pr-[var(--size-space-300)] pb-[var(--size-space-300)] pl-[var(--size-space-300)] relative flex-1 grow bg-color-background-neutral-tertiary rounded-[var(--size-radius-200)] overflow-hidden border border-solid border-color-border-neutral-secondary transition-colors duration-200 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-color-border-brand-default focus:ring-offset-2"
          type="button"
          aria-label="Login to your account"
        >
          <span className="relative w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-color-text-default-default text-[21px] tracking-[0] leading-[21px] whitespace-nowrap">
            Login
          </span>
        </button>

        <button
          onClick={handleRegisterClick}
          className="all-[unset] box-border flex items-center justify-center gap-[var(--size-space-200)] pt-[var(--size-space-300)] pr-[var(--size-space-300)] pb-[var(--size-space-300)] pl-[var(--size-space-300)] relative flex-1 grow bg-[#006400] rounded-[var(--size-radius-200)] overflow-hidden border border-solid border-color-border-brand-default transition-colors duration-200 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-color-border-brand-default focus:ring-offset-2"
          type="button"
          aria-label="Register for a new account"
        >
          <span className="relative w-fit mt-[-1.00px] ml-[-11.50px] mr-[-11.50px] [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--color-text-brand-on-brand)] text-[21px] tracking-[0] leading-[21px] whitespace-nowrap">
            Register
          </span>
        </button>
      </div>
    </header>
  );
};