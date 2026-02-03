function Footer() {
  return (
    <footer>
      <div className="text-center px-4 pb-2 text-sm text-gray-500">
        <p className="max-w-md mx-auto">
          This is not an official Homebrew product.{" "}
          <a
            href="https://sito8943.com?utm_source=uibrew&utm_medium=about_page&utm_campaign=portfolio_link"
            target="_blank"
            rel="noopener"
            className="primary underline !font-bold"
          >
            Sito8943
          </a>{" "}
          is not affiliated with Homebrew or its maintainers. ©{" "}
          {new Date().getFullYear()}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
