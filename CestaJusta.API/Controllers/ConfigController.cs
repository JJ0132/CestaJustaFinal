using Microsoft.AspNetCore.Mvc;

namespace CestaJusta.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConfigController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ConfigController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("google")]
        public ActionResult<GoogleConfigResponse> GetGoogleConfig()
        {
            var clientId = GetGoogleClientId(_configuration);
            return new GoogleConfigResponse(clientId);
        }

        internal static string GetGoogleClientId(IConfiguration configuration) =>
            configuration["Authentication:Google:ClientId"]
            ?? configuration["GOOGLE_CLIENT_ID"]
            ?? string.Empty;
    }

    public record GoogleConfigResponse(string ClientId);
}
