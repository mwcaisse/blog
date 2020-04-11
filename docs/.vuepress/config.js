
module.exports = {
    title: "Code Untamed",
    subTitle: "Hello World",
    theme: "@vuepress/theme-blog",
    themeConfig: {
        dateFormat: "YYYY-MM-DD",
        footer: {
            contact: [
                {
                    type: "github",
                    link: "https://github.com/mwcaisse"
                }
            ],
            copyright: [
                {
                    text: "Copyright Mitchell Caisse © 2020",
                    link: ""
                }
            ]
        }
    },
    plugins: [
        [
            "@vuepress/blog",
            {
                directories: [
                    {
                        id: "post",
                        dirname: "_posts",
                        path: "/",
                        pagination: {
                            lengthPerPage: 10,
                        }
                    }
                ],
                frontmatters: [
                    {
                        id: "tag",
                        keys: ["tag", "tags"],
                        path: "/tag/",
                    }
                ],
                sitemap: {
                    hostname: "https://codeuntamed.com"
                }

            }
        ]
    ]
}